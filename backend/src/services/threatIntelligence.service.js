const crypto = require("node:crypto");
const UnifiedThreatIndicator = require("../models/UnifiedThreatIndicator");
const ThreatIndicator = require("../models/ThreatIndicator");
const AutonomousAttackPattern = require("../models/AutonomousAttackPattern");
const DistressSignal = require("../models/DistressSignal");
const RemoteCommand = require("../models/RemoteCommand");
const FileActivityEvent = require("../models/FileActivityEvent");
const EdgeDevice = require("../models/EdgeDevice");
const GhostTraceEvent = require("../models/GhostTraceEvent");
const Vessel = require("../models/Vessel");
const NetworkPolicy = require("../models/NetworkPolicy");
const { writeAuditLog } = require("./audit.service");

const canonicalize = (value) => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") return Object.keys(value).sort().reduce((out, key) => ({ ...out, [key]: canonicalize(value[key]) }), {});
    return value;
};
const normalizeValue = (type, value) => {
    if (value === null || value === undefined) return "";
    return ["DOMAIN", "IP"].includes(type) ? String(value).trim().toLowerCase() : String(value).trim();
};
const fingerprintFor = (type, value) => crypto.createHash("sha256").update(JSON.stringify({ type, value: normalizeValue(type, value) })).digest("hex");

const publishIndicator = async (input, io, options = {}) => {
    const type = String(input.type || "").toUpperCase();
    const value = normalizeValue(type, input.value);
    if (!value) throw Object.assign(new Error("Indicator value is required"), { status: 400 });
    const extractedVector = canonicalize(input.extractedVector || {});
    const fingerprint = fingerprintFor(type, value);
    let indicator = await UnifiedThreatIndicator.findOne({ fingerprint });
    if (indicator) {
        indicator.lastSeenAt = new Date();
        if (options.increment !== false) indicator.occurrences += 1;
        indicator.confidence = Math.max(indicator.confidence, Number(input.confidence || 0));
        if (["HIGH", "CRITICAL"].includes(input.severity)) indicator.severity = input.severity;
        if (indicator.status !== "FALSE_POSITIVE") indicator.status = "ACTIVE";
        await indicator.save();
        if (io && ["HIGH", "CRITICAL"].includes(indicator.severity)) io.to("fleet:all").emit("threat-intelligence:new", indicator);
        return { indicator, duplicate: true };
    }
    const vessels = await Vessel.find({ isActive: true }).select("_id status").lean();
    indicator = await UnifiedThreatIndicator.create({
        indicatorId: `UTI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        fingerprint, type, value, sourceModule: input.sourceModule, sourceRef: input.sourceRef || {},
        discoveryVessel: input.discoveryVessel || null, severity: input.severity || "MEDIUM",
        confidence: Number(input.confidence || 50), reason: input.reason, extractedVector,
        rawDataIncluded: false, fleetWide: input.fleetWide !== false,
        shoreSyncStatus: input.shoreSyncStatus || (input.discoveryVessel && vessels.find((vessel) => String(vessel._id) === String(input.discoveryVessel))?.status !== "ONLINE" ? "QUEUED" : "SYNCED"), confirmedBy: input.confirmedBy || null,
        distributions: vessels.map((vessel) => ({ vessel: vessel._id, status: vessel.status === "ONLINE" ? "APPLIED" : "PENDING", appliedAt: vessel.status === "ONLINE" ? new Date() : null })),
    });
    writeAuditLog({ user: input.confirmedBy || null, actorRole: input.confirmedBy ? "AUTHORIZED_USER" : "THREAT_INTELLIGENCE_ENGINE", vessel: input.discoveryVessel || null, action: "THREAT_INDICATOR_PUBLISHED", resource: "UNIFIED_THREAT_INDICATOR", resourceId: String(indicator._id), description: `${type} indicator shared fleet-wide`, metadata: { indicatorId: indicator.indicatorId, fingerprint, severity: indicator.severity, rawDataIncluded: false } }).catch((error) => console.error("Threat intelligence audit error:", error.message));
    if (io && ["HIGH", "CRITICAL"].includes(indicator.severity)) io.to("fleet:all").emit("threat-intelligence:new", indicator);
    return { indicator, duplicate: false };
};

const reconcileConfirmedEvidence = async (io) => {
    const [network, attacks, distress, commands, ransomware, devices, gps] = await Promise.all([
        ThreatIndicator.find({ active: true, verdict: { $in: ["MALICIOUS", "SUSPICIOUS"] } }).lean(),
        AutonomousAttackPattern.find({ active: true }).lean(),
        DistressSignal.find({ status: "REJECTED", "review.decision": "REJECT" }).lean(),
        RemoteCommand.find({ decision: "BLOCK" }).lean(),
        FileActivityEvent.find({ classification: "RANSOMWARE_CONFIRMED" }).lean(),
        EdgeDevice.find({ "health.riskLevel": { $in: ["HIGH", "CRITICAL"] } }).lean(),
        GhostTraceEvent.find({ detected: true, confidenceLevel: "HIGH" }).lean(),
    ]);
    const candidates = [
        ...network.map((item) => ({ type: item.indicatorType, value: item.value, sourceModule: "NETGUARD", sourceRef: { model: "ThreatIndicator", id: String(item._id) }, severity: item.verdict === "MALICIOUS" ? "HIGH" : "MEDIUM", confidence: item.confidence, reason: item.reason })),
        ...attacks.map((item) => ({ type: "ATTACK_PATTERN", value: item.signature, sourceModule: "AGENTWATCH", sourceRef: { model: "AutonomousAttackPattern", id: String(item._id) }, severity: "HIGH", confidence: item.confidence, reason: `Confirmed ${item.stageSequence.join(" -> ")} sequence`, extractedVector: { stages: item.stageSequence, eventKinds: item.eventKinds, mitreTechniqueIds: item.mitreTechniqueIds } })),
        ...distress.map((item) => ({ type: "FALSE_DISTRESS", value: `${item.mmsi}:${item.format}`, sourceModule: "SARVERIFY", sourceRef: { model: "DistressSignal", id: String(item._id) }, discoveryVessel: item.receivingVessel, severity: "HIGH", confidence: item.confidence, reason: "Operator-rejected distress signal", extractedVector: { mmsi: item.mmsi, format: item.format, decision: item.decision } })),
        ...commands.map((item) => ({ type: "COMMAND_SIGNATURE", value: `${item.type}:${item.operatorRole}`, sourceModule: "ROCSHIELD", sourceRef: { model: "RemoteCommand", id: String(item._id) }, discoveryVessel: item.vessel, severity: "HIGH", confidence: item.riskPercent, reason: item.explanation?.whatCausedIt || "High-risk remote command blocked", extractedVector: { type: item.type, role: item.operatorRole, decision: item.decision } })),
        ...ransomware.map((item) => ({ type: "RANSOMWARE_SIGNATURE", value: item.extensionsObserved.sort().join(",") || item.deviceId, sourceModule: "RECOVERYSHIELD", sourceRef: { model: "FileActivityEvent", id: String(item._id) }, discoveryVessel: item.vessel, severity: "CRITICAL", confidence: item.confidence, reason: item.explanation?.whatCausedIt || "Ransomware behavior confirmed", extractedVector: { extensions: item.extensionsObserved, signals: item.signals } })),
        ...devices.map((item) => ({ type: "DEVICE_COMPROMISE", value: `${item.deviceId}:${item.health.anomalyCodes.join(",")}`, sourceModule: "EDGEARMOR", sourceRef: { model: "EdgeDevice", id: String(item._id) }, discoveryVessel: item.vessel, severity: item.health.riskLevel, confidence: item.health.riskScore, reason: item.health.reasons.join("; ") || "High-risk edge device", extractedVector: { type: item.type, anomalyCodes: item.health.anomalyCodes, firmwareMismatch: item.reportedFirmware !== item.approvedFirmware } })),
        ...gps.map((item) => ({ type: "GPS_SPOOFING", value: `${item.alertType}:${Number(item.confidenceScore).toFixed(2)}`, sourceModule: "GHOSTTRACE", sourceRef: { model: "GhostTraceEvent", id: String(item._id) }, discoveryVessel: item.vessel, severity: "HIGH", confidence: Math.round(item.confidenceScore * 100), reason: item.explanation?.whatCausedIt || "High-confidence GPS inconsistency", extractedVector: { alertType: item.alertType, anomalyScores: item.anomalyScores } })),
    ];
    let created = 0;
    for (const candidate of candidates) {
        const result = await publishIndicator(candidate, io, { increment: false });
        if (!result.duplicate) created += 1;
    }
    return { scanned: candidates.length, created };
};

const syncVesselIndicators = async (vesselId) => {
    const indicators = await UnifiedThreatIndicator.find({ status: "ACTIVE", distributions: { $elemMatch: { vessel: vesselId, status: "PENDING" } } });
    for (const indicator of indicators) {
        const item = indicator.distributions.find((entry) => String(entry.vessel) === String(vesselId));
        item.status = "APPLIED"; item.appliedAt = new Date(); item.error = "";
        await indicator.save();
        if (indicator.type === "DOMAIN") {
            const policy = await NetworkPolicy.findOne({ vessel: vesselId });
            if (policy && !policy.localBlocklist.includes(indicator.value)) { policy.localBlocklist.push(indicator.value); policy.policyVersion += 1; await policy.save(); }
        }
    }
    await UnifiedThreatIndicator.updateMany({ discoveryVessel: vesselId, shoreSyncStatus: "QUEUED" }, { $set: { shoreSyncStatus: "SYNCED" } });
    return indicators.length;
};

module.exports = { fingerprintFor, publishIndicator, reconcileConfirmedEvidence, syncVesselIndicators };
