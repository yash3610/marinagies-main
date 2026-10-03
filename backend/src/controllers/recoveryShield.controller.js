const crypto = require("node:crypto");
const mongoose = require("mongoose");
const RecoverySnapshot = require("../models/RecoverySnapshot");
const FileActivityEvent = require("../models/FileActivityEvent");
const RecoveryCase = require("../models/RecoveryCase");
const Vessel = require("../models/Vessel");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const EdgeDevice = require("../models/EdgeDevice");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { createSnapshot, verifySnapshot, ingestFileActivity, previewRecovery, restoreRecoveryCase } = require("../services/recoveryShield.service");

const populateCase = (query) => query.populate("vessel", "name vesselId status riskScore riskLevel").populate("detection").populate("incident", "incidentId title status severity").populate("alert", "alertId status severity").populate("selectedSnapshot", "snapshotId kind createdAt sha256 manifest locked").populate("affectedDevices", "deviceId name containmentState").populate("initiatedBy completedBy", "name email role");

const getOverview = async (req, res) => {
    try {
        const scope = vesselScope(req);
        const [snapshots, events, cases] = await Promise.all([
            RecoverySnapshot.find(scope).populate("vessel", "name vesselId").sort({ createdAt: -1 }).limit(150).lean(),
            FileActivityEvent.find(scope).populate("vessel", "name vesselId").populate("device", "deviceId name containmentState").sort({ timestamp: -1 }).limit(100).lean(),
            populateCase(RecoveryCase.find(scope).sort({ createdAt: -1 }).limit(100)).lean(),
        ]);
        res.status(200).json({ success: true, snapshots, events, cases, stats: { snapshots: snapshots.length, fullSnapshots: snapshots.filter((item) => item.kind === "FULL").length, activeCases: cases.filter((item) => !["RECOVERED", "FAILED"].includes(item.status)).length, contained: cases.filter((item) => item.status === "CONTAINED").length, recovered: cases.filter((item) => item.status === "RECOVERED").length, latestCleanSnapshot: snapshots[0]?.createdAt || null } });
    } catch (error) { console.error("RecoveryShield overview error:", error); res.status(500).json({ success: false, message: "Failed to load RecoveryShield data" }); }
};

const createManualSnapshot = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const snapshot = await createSnapshot({ vesselId: req.body.vessel, kind: req.body.kind || "FULL", source: "MANUAL", changedItemCount: req.body.changedItemCount || 0, actor: req.user.userId });
        res.locals.auditVesselId = String(snapshot.vessel); res.locals.auditResourceId = String(snapshot._id);
        res.status(201).json({ success: true, message: `${snapshot.kind} encrypted snapshot created and locked`, snapshot });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

const verifySnapshotEndpoint = async (req, res) => {
    try {
        const snapshot = await RecoverySnapshot.findOne({ _id: req.params.id, ...vesselScope(req) }).lean();
        if (!snapshot) return res.status(404).json({ success: false, message: "Snapshot not found" });
        const result = await verifySnapshot(snapshot._id);
        res.locals.auditVesselId = String(snapshot.vessel); res.locals.auditResourceId = String(snapshot._id);
        res.status(result.verified ? 200 : 409).json({ success: result.verified, message: result.verified ? "Snapshot AES-GCM and SHA-256 integrity verified" : "Snapshot integrity verification failed", verification: { verified: result.verified, expectedHash: snapshot.sha256, observedHash: result.observedHash, snapshotId: snapshot.snapshotId } });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

const ingestActivity = async (req, res) => {
    try {
        if (!req.user?.serviceAccount && !canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const result = await ingestFileActivity(req.body, req.app.get("io"));
        res.locals.auditVesselId = String(result.event.vessel?._id || result.event.vessel); res.locals.auditResourceId = String(result.event._id);
        res.status(201).json({ success: true, message: `File activity classified as ${result.event.classification}`, ...result });
    } catch (error) { res.status(error.status || (error?.code === 11000 ? 409 : 400)).json({ success: false, message: error.message }); }
};

const startManualRecovery = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const [vessel, snapshot] = await Promise.all([Vessel.findOne({ _id: req.body.vessel, isActive: true }), RecoverySnapshot.findOne({ _id: req.body.snapshot, vessel: req.body.vessel }).lean()]);
        if (!vessel || !snapshot) return res.status(404).json({ success: false, message: "Vessel or snapshot not found" });
        const alert = await Alert.create({ alertId: `RS-MANUAL-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: vessel._id, type: "SYSTEM_ANOMALY", severity: "HIGH", title: "RecoveryShield manual recovery initiated", message: req.body.reason || "Authorized operator started recovery after delayed detection", source: "MANUAL", confidence: 100, confidenceLevel: "HIGH", module: "RECOVERYSHIELD", explanation: { whatHappened: "An authorized user initiated independent recovery.", whyItMatters: "Recovery remains available even when automated detection was delayed.", whatCausedIt: req.body.reason || "Manual incident response decision.", recommendedAction: "Preview and verify the selected snapshot before restore." } });
        const incident = await Incident.create({ incidentId: `RSM-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: vessel._id, alert: alert._id, type: "CYBER_ATTACK", severity: "HIGH", title: "Manual ransomware recovery", description: req.body.reason || "Independent RecoveryShield rollback", priority: "HIGH", source: "MANUAL", confidence: 100 });
        const recoveryCase = await RecoveryCase.create({ caseId: `RSC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: vessel._id, incident: incident._id, alert: alert._id, status: "RESTORE_PENDING", fileSynchronizationEnabled: false, emergencyCommunicationActive: true, selectedSnapshot: snapshot._id, initiatedBy: req.user.userId, steps: [{ step: "MANUAL_RECOVERY_INITIATED", status: "COMPLETED", message: req.body.reason || "Recovery initiated independently of automated detection.", actor: req.user.userId }] });
        res.locals.auditVesselId = String(vessel._id); res.locals.auditResourceId = String(recoveryCase._id);
        res.status(201).json({ success: true, message: "Independent recovery case created", recoveryCase });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const previewCase = async (req, res) => {
    try {
        const recoveryCase = await RecoveryCase.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!recoveryCase) return res.status(404).json({ success: false, message: "Recovery case not found" });
        const snapshot = await RecoverySnapshot.findOne({ _id: req.body.snapshot, vessel: recoveryCase.vessel }).lean();
        if (!snapshot) return res.status(404).json({ success: false, message: "Snapshot not found for this vessel" });
        const preview = await previewRecovery({ recoveryCase, snapshot });
        recoveryCase.selectedSnapshot = snapshot._id; recoveryCase.preview = preview; recoveryCase.status = "RESTORE_PENDING"; recoveryCase.steps.push({ step: "ROLLBACK_PREVIEW_GENERATED", status: "COMPLETED", message: `${preview.overwriteCount} item(s) previewed for restore.`, actor: req.user.userId, evidence: preview }); await recoveryCase.save();
        res.locals.auditVesselId = String(recoveryCase.vessel); res.locals.auditResourceId = String(recoveryCase._id);
        res.status(200).json({ success: true, message: "Rollback preview generated and snapshot integrity verified", preview });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

const executeRestore = async (req, res) => {
    try {
        const scopedCase = await RecoveryCase.findOne({ _id: req.params.id, ...vesselScope(req) }).select("_id selectedSnapshot vessel").lean();
        if (!scopedCase) return res.status(404).json({ success: false, message: "Recovery case not found" });
        const snapshotId = req.body.snapshot || scopedCase.selectedSnapshot;
        if (!snapshotId) return res.status(400).json({ success: false, message: "Select and preview a rollback snapshot first" });
        const recoveryCase = await restoreRecoveryCase({ recoveryCaseId: scopedCase._id, snapshotId, actor: req.user.userId, io: req.app.get("io") });
        res.locals.auditVesselId = String(scopedCase.vessel); res.locals.auditResourceId = String(scopedCase._id);
        res.status(200).json({ success: true, message: "Recovery completed, integrity verified and services re-enabled", recoveryCase, report: recoveryCase.incident ? `/api/incidents/${recoveryCase.incident}/report.pdf` : null });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message || "Recovery failed" }); }
};

const markShoreSynced = async (req, res) => {
    try {
        const recoveryCase = await RecoveryCase.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!recoveryCase) return res.status(404).json({ success: false, message: "Recovery case not found" });
        recoveryCase.shoreSyncStatus = "SYNCED"; recoveryCase.steps.push({ step: "SHORE_AUDIT_SYNCED", status: "COMPLETED", message: "Recovery evidence synchronized to the shore audit store.", actor: req.user.userId }); await recoveryCase.save();
        res.locals.auditVesselId = String(recoveryCase.vessel); res.locals.auditResourceId = String(recoveryCase._id);
        res.status(200).json({ success: true, message: "Recovery evidence marked synchronized", recoveryCase });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const simulateRansomware = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        let snapshot = await RecoverySnapshot.findOne({ vessel: req.body.vessel }).sort({ createdAt: -1 }).lean();
        if (!snapshot) snapshot = await createSnapshot({ vesselId: req.body.vessel, kind: "FULL", source: "DEMO", actor: req.user.userId });
        const demoDevice = req.body.deviceId ? null : await EdgeDevice.findOne({ vessel: req.body.vessel }).sort({ criticality: -1 }).lean();
        const result = await ingestFileActivity({ eventId: `RANSOM-DEMO-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`, vessel: req.body.vessel, deviceId: req.body.deviceId || demoDevice?.deviceId || "DEMO-FILE-SERVER", modificationsPerMinute: 640, directoriesAffected: 12, extensionsObserved: [".locked", ".encrypted"], cpuPercent: 96, ioPercent: 94, filesSample: ["/navigation/routes.db.locked", "/config/network.json.encrypted"], simulated: true }, req.app.get("io"));
        res.locals.auditVesselId = String(req.body.vessel); res.locals.auditResourceId = String(result.event._id);
        res.status(201).json({ success: true, message: "Ransomware simulation detected and automatically contained", snapshot, ...result });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

module.exports = { getOverview, createManualSnapshot, verifySnapshotEndpoint, ingestActivity, startManualRecovery, previewCase, executeRestore, markShoreSynced, simulateRansomware };
