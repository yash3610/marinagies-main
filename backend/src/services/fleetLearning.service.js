const crypto = require("node:crypto");
const FleetModel = require("../models/FleetModel");
const VesselModelDeployment = require("../models/VesselModelDeployment");
const UnifiedThreatIndicator = require("../models/UnifiedThreatIndicator");
const Vessel = require("../models/Vessel");
const { writeAuditLog } = require("./audit.service");

const MODULE_TYPES = { GHOSTTRACE: ["GPS_SPOOFING"], NETGUARD: ["DOMAIN", "IP"], AGENTWATCH: ["ATTACK_PATTERN"], EDGEARMOR: ["DEVICE_COMPROMISE"], SARVERIFY: ["FALSE_DISTRESS"], ROCSHIELD: ["COMMAND_SIGNATURE"], RECOVERYSHIELD: ["RANSOMWARE_SIGNATURE"] };

const buildCandidate = async ({ modelKey, module, actor, notes }) => {
    const normalizedModule = String(module || "").toUpperCase();
    const types = MODULE_TYPES[normalizedModule];
    if (!types) throw Object.assign(new Error("Unsupported learning module"), { status: 400 });
    const indicators = await UnifiedThreatIndicator.find({ type: { $in: types }, status: "ACTIVE", confidence: { $gte: 70 } }).select("fingerprint").sort({ fingerprint: 1 }).lean();
    if (!indicators.length) throw Object.assign(new Error("No confirmed indicators are available for this module"), { status: 409 });
    const key = String(modelKey || `${normalizedModule}_FLEET_PACK`).toUpperCase();
    const latest = await FleetModel.findOne({ modelKey: key }).sort({ version: -1 }).lean();
    const fingerprints = indicators.map((item) => item.fingerprint);
    const artifactHash = crypto.createHash("sha256").update(JSON.stringify({ key, fingerprints })).digest("hex");
    const existing = await FleetModel.findOne({ modelKey: key, artifactHash }).lean();
    if (existing) throw Object.assign(new Error(`Identical candidate already exists as version ${existing.version}`), { status: 409 });
    const candidate = await FleetModel.create({ modelKey: key, module: normalizedModule, version: (latest?.version || 0) + 1, previousVersion: latest?.version || null, patternFingerprints: fingerprints, patternCount: fingerprints.length, artifactHash, createdBy: actor, notes: notes || "Confirmed fleet indicators aggregated without raw vessel data" });
    await writeAuditLog({ user: actor, actorRole: "FLEET_LEARNING_OPERATOR", action: "FLEET_MODEL_CANDIDATE_CREATED", resource: "FLEET_MODEL", resourceId: String(candidate._id), description: `${key} v${candidate.version} created from ${fingerprints.length} extracted patterns`, metadata: { artifactHash, rawDataIncluded: false } });
    return candidate;
};

const validateCandidate = async ({ model, precision, recall, dataset, actor }) => {
    if (!model || model.status !== "CANDIDATE") throw Object.assign(new Error("Only candidate versions can be validated"), { status: 409 });
    const p = Number(precision); const r = Number(recall);
    if (!Number.isFinite(p) || !Number.isFinite(r) || p < 0 || p > 1 || r < 0 || r > 1) throw Object.assign(new Error("precision and recall must be values from 0 to 1"), { status: 400 });
    model.validation = { precision: p, recall: r, f1: p + r ? (2 * p * r) / (p + r) : 0, dataset: String(dataset || "").slice(0, 200), validatedAt: new Date(), validatedBy: actor };
    model.status = p >= 0.9 && r >= 0.85 ? "VALIDATED" : "REJECTED";
    await model.save();
    await writeAuditLog({ user: actor, actorRole: "FLEET_LEARNING_VALIDATOR", action: `FLEET_MODEL_${model.status}`, resource: "FLEET_MODEL", resourceId: String(model._id), description: `${model.modelKey} v${model.version} validation ${model.status.toLowerCase()}`, metadata: { precision: p, recall: r, dataset: model.validation.dataset } });
    return model;
};

const activateModel = async ({ model, actor }) => {
    if (!model || model.status !== "VALIDATED") throw Object.assign(new Error("Model must pass precision >= 0.90 and recall >= 0.85 before activation"), { status: 409 });
    await FleetModel.updateMany({ modelKey: model.modelKey, status: "ACTIVE" }, { $set: { status: "RETIRED" } });
    model.status = "ACTIVE"; model.activatedBy = actor; model.activatedAt = new Date(); await model.save();
    const vessels = await Vessel.find({ isActive: true }).select("_id status").lean();
    for (const vessel of vessels) {
        const current = await VesselModelDeployment.findOne({ vessel: vessel._id, modelKey: model.modelKey });
        await VesselModelDeployment.findOneAndUpdate({ vessel: vessel._id, modelKey: model.modelKey }, { $set: { previousVersion: current?.currentVersion || null, targetVersion: model.version, status: vessel.status === "ONLINE" ? "APPLIED" : "PENDING", appliedAt: vessel.status === "ONLINE" ? new Date() : null, lastSyncAt: vessel.status === "ONLINE" ? new Date() : current?.lastSyncAt || null, error: "", ...(vessel.status === "ONLINE" ? { currentVersion: model.version } : {}) }, $setOnInsert: { queuedAt: new Date() } }, { upsert: true, new: true, runValidators: true });
    }
    await writeAuditLog({ user: actor, actorRole: "FLEET_LEARNING_OPERATOR", action: "FLEET_MODEL_ACTIVATED", resource: "FLEET_MODEL", resourceId: String(model._id), description: `${model.modelKey} v${model.version} queued across ${vessels.length} vessels`, metadata: { artifactHash: model.artifactHash, vessels: vessels.length } });
    return model;
};

const syncVesselModels = async (vesselId) => VesselModelDeployment.updateMany({ vessel: vesselId, status: "PENDING" }, [{ $set: { previousVersion: "$currentVersion", currentVersion: "$targetVersion", status: "APPLIED", appliedAt: new Date(), lastSyncAt: new Date(), error: "" } }]);

const rollbackDeployment = async ({ deployment, actor }) => {
    if (!deployment?.previousVersion) throw Object.assign(new Error("No previous version is available for rollback"), { status: 409 });
    const replaced = deployment.currentVersion;
    deployment.currentVersion = deployment.previousVersion; deployment.previousVersion = replaced; deployment.targetVersion = deployment.currentVersion; deployment.status = "ROLLED_BACK"; deployment.appliedAt = new Date(); deployment.lastSyncAt = new Date(); await deployment.save();
    await writeAuditLog({ user: actor, actorRole: "FLEET_LEARNING_OPERATOR", vessel: deployment.vessel, action: "FLEET_MODEL_ROLLED_BACK", resource: "VESSEL_MODEL_DEPLOYMENT", resourceId: String(deployment._id), description: `${deployment.modelKey} rolled back from v${replaced} to v${deployment.currentVersion}` });
    return deployment;
};

module.exports = { MODULE_TYPES, buildCandidate, validateCandidate, activateModel, syncVesselModels, rollbackDeployment };
