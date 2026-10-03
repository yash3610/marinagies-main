const crypto = require("node:crypto");
const RecoverySnapshot = require("../models/RecoverySnapshot");
const FileActivityEvent = require("../models/FileActivityEvent");
const RecoveryCase = require("../models/RecoveryCase");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const EdgeDevice = require("../models/EdgeDevice");
const NetworkPolicy = require("../models/NetworkPolicy");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");
const { appendIncidentEventSafely } = require("./incidentTimeline.service");

const RANSOMWARE_EXTENSIONS = new Set([".locked", ".encrypted", ".crypt", ".crypto", ".enc", ".lockbit", ".ryuk", ".conti"]);
const canonicalJson = (value) => JSON.stringify(value);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const keyMaterial = () => {
    const material = process.env.RECOVERY_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!material || material.length < 32) throw new Error("RECOVERY_ENCRYPTION_KEY must contain at least 32 characters");
    return material;
};
const dailyKey = (vesselId, date = new Date()) => {
    const day = date.toISOString().slice(0, 10);
    return { key: crypto.createHash("sha256").update(`${keyMaterial()}:${vesselId}:${day}`).digest(), keyId: `vessel:${vesselId}:${day}` };
};
const encryptPayload = (payload, vesselId, date = new Date()) => {
    const plaintext = canonicalJson(payload);
    const { key, keyId } = dailyKey(vesselId, date);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return { encryptedPayload: encrypted.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64"), keyId, plaintextHash: sha256(plaintext), plaintextBytes: Buffer.byteLength(plaintext) };
};
const decryptPayload = (snapshot) => {
    const day = snapshot.encryption.keyId.split(":").at(-1);
    const { key } = dailyKey(snapshot.vessel, new Date(`${day}T00:00:00.000Z`));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(snapshot.iv, "base64"));
    decipher.setAuthTag(Buffer.from(snapshot.authTag, "base64"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(snapshot.encryptedPayload, "base64")), decipher.final()]).toString("utf8");
    return { payload: JSON.parse(plaintext), observedHash: sha256(plaintext), verified: sha256(plaintext) === snapshot.sha256 };
};

const captureVesselState = async (vesselId) => {
    const [vessel, currentState, networkPolicy, devices] = await Promise.all([
        Vessel.findById(vesselId).lean(),
        VesselCurrentState.findOne({ vessel: vesselId }).lean(),
        NetworkPolicy.findOne({ vessel: vesselId }).lean(),
        EdgeDevice.find({ vessel: vesselId }).sort({ deviceId: 1 }).lean(),
    ]);
    if (!vessel) throw Object.assign(new Error("Vessel not found"), { status: 404 });
    return {
        schemaVersion: 1,
        vessel: { id: String(vessel._id), name: vessel.name, vesselId: vessel.vesselId, status: vessel.status, riskScore: vessel.riskScore, riskLevel: vessel.riskLevel, latitude: vessel.latitude, longitude: vessel.longitude, speed: vessel.speed, heading: vessel.heading, destination: vessel.destination, route: vessel.route },
        currentState: currentState ? { speed: currentState.speed, heading: currentState.heading, latitude: currentState.latitude, longitude: currentState.longitude, depth: currentState.depth, gpsSignal: currentState.gpsSignal, aisStatus: currentState.aisStatus, deviceStatus: currentState.deviceStatus, engineTemperature: currentState.engineTemperature, fuelLevel: currentState.fuelLevel } : null,
        networkPolicy: networkPolicy ? { policyVersion: networkPolicy.policyVersion, dns: networkPolicy.dns, segmentationRules: networkPolicy.segmentationRules, satellite: networkPolicy.satellite } : null,
        devices: devices.map((device) => ({ id: String(device._id), deviceId: device.deviceId, status: device.status, containmentState: device.containmentState, reportedFirmware: device.reportedFirmware, approvedFirmware: device.approvedFirmware, health: device.health })),
    };
};

const createSnapshot = async ({ vesselId, kind = "INCREMENTAL", source = "MANUAL", changedItemCount = 0, actor = null }) => {
    const normalizedKind = String(kind).toUpperCase();
    if (!["INCREMENTAL", "FULL"].includes(normalizedKind)) throw Object.assign(new Error("Snapshot kind must be INCREMENTAL or FULL"), { status: 400 });
    const createdAt = new Date();
    const payload = await captureVesselState(vesselId);
    const encrypted = encryptPayload(payload, vesselId, createdAt);
    const retentionDays = normalizedKind === "FULL" ? 30 : 90;
    const snapshotId = `RS-${normalizedKind.slice(0, 3)}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const itemCount = 1 + (payload.currentState ? 1 : 0) + (payload.networkPolicy ? 1 : 0) + payload.devices.length;
    const snapshot = await RecoverySnapshot.create({ snapshotId, vessel: vesselId, kind: normalizedKind, objectKey: `worm://${vesselId}/${createdAt.toISOString().slice(0, 10)}/${snapshotId}.aes`, encryptedPayload: encrypted.encryptedPayload, iv: encrypted.iv, authTag: encrypted.authTag, encryption: { algorithm: "AES-256-GCM", keyId: encrypted.keyId }, sha256: encrypted.plaintextHash, manifest: { itemCount, changedItemCount: normalizedKind === "FULL" ? itemCount : Number(changedItemCount || 0), estimatedBytes: encrypted.plaintextBytes, includedScopes: ["VESSEL_CONFIG", "CURRENT_STATE", "NETWORK_POLICY", "EDGE_DEVICES"] }, locked: true, lockedUntil: new Date(createdAt.getTime() + retentionDays * 86400000), createdAt, expiresAt: new Date(createdAt.getTime() + retentionDays * 86400000), source });
    writeAuditLog({ user: actor, actorRole: actor ? "AUTHORIZED_USER" : "RECOVERY_SCHEDULER", vessel: vesselId, action: "RECOVERY_SNAPSHOT_CREATED", resource: "RECOVERY_SNAPSHOT", resourceId: String(snapshot._id), description: `${normalizedKind} encrypted snapshot created and WORM-locked`, metadata: { snapshotId, sha256: snapshot.sha256, objectKey: snapshot.objectKey, retentionDays } }).catch((error) => console.error("Recovery snapshot audit error:", error.message));
    return snapshot;
};

const verifySnapshot = async (snapshotId) => {
    const snapshot = await RecoverySnapshot.findById(snapshotId).select("+encryptedPayload +iv +authTag");
    if (!snapshot) throw Object.assign(new Error("Recovery snapshot not found"), { status: 404 });
    const result = decryptPayload(snapshot);
    return { snapshot, ...result };
};

const analyzeFileActivity = (input) => {
    const extensions = [...new Set((input.extensionsObserved || []).map((item) => String(item).toLowerCase().startsWith(".") ? String(item).toLowerCase() : `.${String(item).toLowerCase()}`))];
    const matchedExtensions = extensions.filter((item) => RANSOMWARE_EXTENSIONS.has(item));
    const burst = Number(input.modificationsPerMinute || 0) > 200 && Number(input.directoriesAffected || 0) > 3;
    const extensionPattern = matchedExtensions.length > 0;
    const resourceSpike = Number(input.cpuPercent || 0) >= 80 && Number(input.ioPercent || 0) >= 80;
    const signalCount = [burst, extensionPattern, resourceSpike].filter(Boolean).length;
    const confidence = signalCount === 3 ? 98 : signalCount === 2 ? 72 : signalCount === 1 ? 40 : 5;
    const classification = signalCount === 3 ? "RANSOMWARE_CONFIRMED" : signalCount > 0 ? "SUSPICIOUS" : "NORMAL";
    const reasons = [burst ? `${input.modificationsPerMinute} modifications/minute across ${input.directoriesAffected} directories exceeds the ransomware threshold.` : "Mass modification threshold was not exceeded.", extensionPattern ? `Known encrypted extensions detected: ${matchedExtensions.join(", ")}.` : "No known ransomware extension was detected.", resourceSpike ? `CPU and I/O simultaneously reached ${input.cpuPercent}% and ${input.ioPercent}%.` : "No simultaneous CPU and I/O spike was detected."];
    return { signals: { massModificationBurst: burst, ransomwareExtensionPattern: extensionPattern, cpuIoSpike: resourceSpike, matchedExtensions, signalCount }, confidence, classification, explanation: { whatHappened: `${input.modificationsPerMinute || 0} file modifications/minute affected ${input.directoriesAffected || 0} directories.`, whyItMatters: classification === "RANSOMWARE_CONFIRMED" ? "All three independent ransomware signals agree; propagation must be stopped immediately." : classification === "SUSPICIOUS" ? "At least one ransomware indicator requires investigation, but automatic recovery containment is not yet justified." : "File activity remains within the normal operating envelope.", whatCausedIt: reasons.join(" "), recommendedAction: classification === "RANSOMWARE_CONFIRMED" ? "Keep file synchronization disabled, isolate affected devices and restore from the latest verified clean snapshot." : classification === "SUSPICIOUS" ? "Review affected files and collect another activity window." : "Continue monitoring." } };
};

const addStep = (recoveryCase, step, message, evidence = {}, actor = null) => recoveryCase.steps.push({ step, status: "COMPLETED", message, evidence, actor, occurredAt: new Date() });
const auditRecoverySteps = async ({ recoveryCase, steps, actor = null, actorRole = "RECOVERYSHIELD_ENGINE" }) => {
    for (const step of steps) {
        await writeAuditLog({ user: actor, actorRole, vessel: recoveryCase.vessel, action: `RECOVERY_STEP_${step.step}`, resource: "RECOVERY_CASE", resourceId: String(recoveryCase._id), description: step.message, metadata: { status: step.status, occurredAt: step.occurredAt, evidence: step.evidence || {} } });
    }
};

const containRansomware = async ({ event, vessel, device, io }) => {
    const alert = await Alert.create({ alertId: `RS-ALERT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: vessel._id, type: "CYBER_ATTACK", severity: "CRITICAL", title: "RecoveryShield: Ransomware activity confirmed", message: event.explanation.whatCausedIt, source: "EDGE_AGENT", confidence: event.confidence, confidenceLevel: "HIGH", module: "RECOVERYSHIELD", explanation: event.explanation, evidence: { fileActivityEvent: event._id, signals: event.signals, deviceId: event.deviceId } });
    const incident = await Incident.create({ incidentId: `RSI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: vessel._id, alert: alert._id, type: "CYBER_ATTACK", severity: "CRITICAL", title: "Ransomware containment and recovery", description: event.explanation.whatCausedIt, priority: "URGENT", source: "EDGE_AGENT", confidence: event.confidence });
    const recoveryCase = await RecoveryCase.create({ caseId: `RSC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: vessel._id, detection: event._id, incident: incident._id, alert: alert._id, status: "CONTAINED", affectedDevices: device ? [device._id] : [], affectedDeviceIds: [event.deviceId], fileSynchronizationEnabled: false, emergencyCommunicationActive: true, steps: [
        { step: "DETECTION_CONFIRMED", status: "COMPLETED", message: "All ransomware signals confirmed.", evidence: { event: event._id, confidence: event.confidence } },
        { step: "FILE_SYNC_DISABLED", status: "COMPLETED", message: "File synchronization services disabled locally." },
        { step: "DEVICE_ISOLATED", status: "COMPLETED", message: device ? `${device.deviceId} quarantined by EdgeArmor.` : `${event.deviceId} marked isolated pending device registration.` },
        { step: "BACKUP_COMMUNICATION_ACTIVE", status: "COMPLETED", message: "Emergency satellite backup communication activated." },
    ] });
    auditRecoverySteps({ recoveryCase, steps: recoveryCase.steps }).catch((error) => console.error("Recovery containment audit error:", error.message));
    if (device) { device.containmentState = "QUARANTINED"; device.quarantine = { reason: `RecoveryShield incident ${incident.incidentId}`, quarantinedAt: new Date(), quarantinedBy: null, releasedAt: null, releasedBy: null }; await device.save(); emitVesselEvent(io, "edge-device:update", device, vessel._id); }
    await NetworkPolicy.findOneAndUpdate({ vessel: vessel._id }, { $set: { "satellite.activeProvider": "SATCOM_BACKUP", "satellite.lastSwitchedAt": new Date() }, $inc: { policyVersion: 1 }, $setOnInsert: { vessel: vessel._id } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    event.alert = alert._id; event.incident = incident._id; event.recoveryCase = recoveryCase._id; await event.save();
    appendIncidentEventSafely({ incident: incident._id, vessel: vessel._id, eventType: "DETECTION", title: "Ransomware activity confirmed", description: event.explanation.whatCausedIt, source: "RECOVERYSHIELD", severity: "CRITICAL", data: { event: event._id, recoveryCase: recoveryCase._id, signals: event.signals } });
    appendIncidentEventSafely({ incident: incident._id, vessel: vessel._id, eventType: "STATUS_CHANGED", title: "Automatic ransomware containment completed", description: "File sync disabled, affected device isolated and backup satellite communication enabled.", source: "RECOVERYSHIELD", severity: "CRITICAL", data: { recoveryCase: recoveryCase._id } });
    emitVesselEvent(io, "alert:new", alert, vessel._id); emitVesselEvent(io, "incident:new", incident, vessel._id); emitVesselEvent(io, "recovery:case", recoveryCase, vessel._id);
    return recoveryCase;
};

const ingestFileActivity = async (input, io) => {
    const vessel = await Vessel.findOne({ _id: input.vessel, isActive: true });
    if (!vessel) throw Object.assign(new Error("Vessel not found or inactive"), { status: 404 });
    const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();
    if (Number.isNaN(timestamp.getTime()) || timestamp > new Date(Date.now() + 5 * 60000)) throw Object.assign(new Error("Invalid file activity timestamp"), { status: 400 });
    const device = await EdgeDevice.findOne({ vessel: vessel._id, deviceId: String(input.deviceId || "").toUpperCase() });
    const analysis = analyzeFileActivity(input);
    let event;
    try { event = await FileActivityEvent.create({ eventId: input.eventId || `file:${vessel._id}:${Date.now()}:${crypto.randomUUID()}`, vessel: vessel._id, device: device?._id || null, deviceId: String(input.deviceId || "UNKNOWN").toUpperCase(), modificationsPerMinute: input.modificationsPerMinute, directoriesAffected: input.directoriesAffected, extensionsObserved: input.extensionsObserved || [], cpuPercent: input.cpuPercent || 0, ioPercent: input.ioPercent || 0, filesSample: input.filesSample || [], timestamp, simulated: Boolean(input.simulated), ...analysis }); }
    catch (error) { if (error?.code === 11000) throw Object.assign(new Error("Duplicate file activity event"), { status: 409 }); throw error; }
    let recoveryCase = null;
    if (analysis.classification === "RANSOMWARE_CONFIRMED") recoveryCase = await containRansomware({ event, vessel, device, io });
    else if (analysis.classification === "SUSPICIOUS") {
        const alert = await Alert.create({ alertId: `RS-WARN-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: vessel._id, type: "SYSTEM_ANOMALY", severity: "MEDIUM", title: "RecoveryShield: Suspicious file activity", message: analysis.explanation.whatCausedIt, source: "EDGE_AGENT", confidence: analysis.confidence, confidenceLevel: "MEDIUM", module: "RECOVERYSHIELD", explanation: analysis.explanation, evidence: { fileActivityEvent: event._id, signals: event.signals } });
        event.alert = alert._id; await event.save(); emitVesselEvent(io, "alert:new", alert, vessel._id);
    }
    const populated = await FileActivityEvent.findById(event._id).populate("vessel", "name vesselId").populate("device", "deviceId name containmentState").populate("recoveryCase").lean();
    emitVesselEvent(io, "recovery:activity", populated, vessel._id);
    writeAuditLog({ actorRole: "RECOVERYSHIELD_ENGINE", vessel: vessel._id, action: `FILE_ACTIVITY_${analysis.classification}`, resource: "FILE_ACTIVITY_EVENT", resourceId: String(event._id), description: analysis.explanation.whatCausedIt, metadata: { confidence: analysis.confidence, signals: analysis.signals, recoveryCase: recoveryCase?._id || null } }).catch((error) => console.error("Recovery detection audit error:", error.message));
    return { event: populated, recoveryCase };
};

const previewRecovery = async ({ recoveryCase, snapshot }) => {
    const verification = await verifySnapshot(snapshot._id);
    if (String(verification.snapshot.vessel) !== String(recoveryCase.vessel)) throw Object.assign(new Error("Snapshot belongs to a different vessel"), { status: 400 });
    const payload = verification.payload;
    return { snapshotVerified: verification.verified, snapshotId: snapshot.snapshotId, createdAt: snapshot.createdAt, kind: snapshot.kind, restoreItems: ["Vessel operational configuration", ...(payload.currentState ? ["Current navigation and machinery state"] : []), ...(payload.networkPolicy ? ["Network and satellite policy"] : []), `${payload.devices.length} edge device configuration(s)`], overwriteCount: snapshot.manifest.itemCount, changedItemCount: snapshot.manifest.changedItemCount, estimatedDurationMinutes: Math.max(1, Math.min(60, Math.ceil(snapshot.manifest.itemCount / 10))), warning: "Current configuration values in the listed scopes will be overwritten after integrity verification." };
};

const restoreRecoveryCase = async ({ recoveryCaseId, snapshotId, actor, io }) => {
    const recoveryCase = await RecoveryCase.findById(recoveryCaseId);
    if (!recoveryCase) throw Object.assign(new Error("Recovery case not found"), { status: 404 });
    if (["RESTORING", "RECOVERED"].includes(recoveryCase.status)) throw Object.assign(new Error(`Recovery case is already ${recoveryCase.status.toLowerCase()}`), { status: 409 });
    const snapshot = await RecoverySnapshot.findOne({ _id: snapshotId, vessel: recoveryCase.vessel }).lean();
    if (!snapshot) throw Object.assign(new Error("Snapshot not found for this vessel"), { status: 404 });
    const initialStepCount = recoveryCase.steps.length;
    const startedAt = new Date(); recoveryCase.status = "RESTORING"; recoveryCase.selectedSnapshot = snapshot._id; recoveryCase.startedAt = startedAt; recoveryCase.initiatedBy ||= actor; addStep(recoveryCase, "RECOVERY_STARTED", `Restore started from ${snapshot.snapshotId}.`, { snapshot: snapshot._id }, actor); await recoveryCase.save();
    try {
        const before = await verifySnapshot(snapshot._id);
        if (!before.verified) throw new Error("Snapshot integrity verification failed before restore");
        recoveryCase.integrity.beforeRestore = true; recoveryCase.integrity.expectedHash = snapshot.sha256; recoveryCase.integrity.observedHash = before.observedHash; addStep(recoveryCase, "PRE_RESTORE_INTEGRITY_VERIFIED", "Snapshot SHA-256 and AES-GCM authentication verified.", { sha256: before.observedHash }, actor);
        const payload = before.payload;
        await Vessel.updateOne({ _id: recoveryCase.vessel }, { $set: { status: "WARNING", riskScore: Math.min(35, payload.vessel.riskScore || 0), riskLevel: "MEDIUM", latitude: payload.vessel.latitude, longitude: payload.vessel.longitude, speed: payload.vessel.speed, heading: payload.vessel.heading, destination: payload.vessel.destination, route: payload.vessel.route } }, { runValidators: true });
        if (payload.currentState) await VesselCurrentState.updateOne({ vessel: recoveryCase.vessel }, { $set: payload.currentState }, { runValidators: true });
        if (payload.networkPolicy) await NetworkPolicy.findOneAndUpdate({ vessel: recoveryCase.vessel }, { $set: { dns: payload.networkPolicy.dns, segmentationRules: payload.networkPolicy.segmentationRules, satellite: payload.networkPolicy.satellite }, $inc: { policyVersion: 1 } }, { new: true, upsert: true, runValidators: true });
        for (const restoredDevice of payload.devices) await EdgeDevice.updateOne({ _id: restoredDevice.id, vessel: recoveryCase.vessel }, { $set: { status: restoredDevice.status, containmentState: "ACTIVE", reportedFirmware: restoredDevice.reportedFirmware, approvedFirmware: restoredDevice.approvedFirmware, health: restoredDevice.health, "quarantine.releasedAt": new Date(), "quarantine.releasedBy": actor } }, { runValidators: true });
        addStep(recoveryCase, "CONFIGURATION_RESTORED", `${snapshot.manifest.itemCount} configuration item(s) restored from the immutable snapshot.`, { itemCount: snapshot.manifest.itemCount }, actor);
        const after = await verifySnapshot(snapshot._id);
        if (!after.verified || after.observedHash !== before.observedHash) throw new Error("Snapshot integrity changed during restore");
        recoveryCase.integrity.afterRestore = true; addStep(recoveryCase, "POST_RESTORE_INTEGRITY_VERIFIED", "Snapshot remained unchanged throughout recovery.", { sha256: after.observedHash }, actor);
        await EdgeDevice.updateMany({ _id: { $in: recoveryCase.affectedDevices } }, { $set: { containmentState: "ACTIVE", "quarantine.releasedAt": new Date(), "quarantine.releasedBy": actor } });
        recoveryCase.fileSynchronizationEnabled = true; recoveryCase.emergencyCommunicationActive = false; recoveryCase.status = "RECOVERED"; recoveryCase.completedBy = actor; recoveryCase.completedAt = new Date(); recoveryCase.recoveryDurationSeconds = Math.max(0, Math.round((recoveryCase.completedAt - startedAt) / 1000)); recoveryCase.reportReady = true; recoveryCase.shoreSyncStatus = "PENDING";
        addStep(recoveryCase, "SERVICES_RECONNECTED", "Affected devices reconnected and file synchronization manually signed off.", {}, actor); addStep(recoveryCase, "RECOVERY_COMPLETED", `Recovery completed in ${recoveryCase.recoveryDurationSeconds} seconds; incident report is ready.`, { reportReady: true }, actor); await recoveryCase.save();
        const recoverySteps = recoveryCase.steps.slice(initialStepCount);
        auditRecoverySteps({ recoveryCase, steps: recoverySteps, actor, actorRole: "AUTHORIZED_RECOVERY_OPERATOR" }).catch((error) => console.error("Recovery step audit error:", error.message));
        if (recoveryCase.alert) await Alert.updateOne({ _id: recoveryCase.alert }, { $set: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: actor } });
        if (recoveryCase.incident) { await Incident.updateOne({ _id: recoveryCase.incident }, { $set: { status: "RESOLVED", resolvedAt: new Date() } }); for (const step of recoverySteps) appendIncidentEventSafely({ incident: recoveryCase.incident, vessel: recoveryCase.vessel, eventType: "STATUS_CHANGED", title: step.step.replaceAll("_", " "), description: step.message, source: "RECOVERYSHIELD", actor, severity: step.step === "RECOVERY_COMPLETED" ? "LOW" : "HIGH", occurredAt: step.occurredAt, data: { recoveryCase: recoveryCase._id, snapshot: snapshot._id, evidence: step.evidence } }); }
        emitVesselEvent(io, "recovery:case", recoveryCase, recoveryCase.vessel);
        writeAuditLog({ user: actor, actorRole: "AUTHORIZED_RECOVERY_OPERATOR", vessel: recoveryCase.vessel, action: "RANSOMWARE_RECOVERY_COMPLETED", resource: "RECOVERY_CASE", resourceId: String(recoveryCase._id), description: `Restored ${snapshot.snapshotId} with verified integrity`, metadata: { snapshot: snapshot._id, sha256: snapshot.sha256, durationSeconds: recoveryCase.recoveryDurationSeconds } }).catch((error) => console.error("Recovery completion audit error:", error.message));
        return recoveryCase;
    } catch (error) {
        recoveryCase.status = "FAILED"; addStep(recoveryCase, "RECOVERY_FAILED", error.message, {}, actor); await recoveryCase.save(); throw error;
    }
};

const runScheduledSnapshots = async () => {
    const vessels = await Vessel.find({ isActive: true }).select("_id").lean();
    const now = Date.now();
    for (const vessel of vessels) {
        const latest = await RecoverySnapshot.findOne({ vessel: vessel._id }).sort({ createdAt: -1 }).lean();
        const latestFull = await RecoverySnapshot.findOne({ vessel: vessel._id, kind: "FULL" }).sort({ createdAt: -1 }).lean();
        if (!latestFull || now - new Date(latestFull.createdAt).getTime() >= 6 * 3600000) await createSnapshot({ vesselId: vessel._id, kind: "FULL", source: "SCHEDULER" });
        else if (!latest || now - new Date(latest.createdAt).getTime() >= 15 * 60000) await createSnapshot({ vesselId: vessel._id, kind: "INCREMENTAL", source: "SCHEDULER" });
    }
};
const startRecoverySnapshotScheduler = () => { runScheduledSnapshots().catch((error) => console.error("Recovery snapshot scheduler error:", error.message)); const timer = setInterval(() => runScheduledSnapshots().catch((error) => console.error("Recovery snapshot scheduler error:", error.message)), 60000); timer.unref?.(); return timer; };

module.exports = { RANSOMWARE_EXTENSIONS, canonicalJson, sha256, encryptPayload, decryptPayload, analyzeFileActivity, captureVesselState, createSnapshot, verifySnapshot, ingestFileActivity, previewRecovery, restoreRecoveryCase, runScheduledSnapshots, startRecoverySnapshotScheduler };
