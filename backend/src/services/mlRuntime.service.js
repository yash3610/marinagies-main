const FleetModel = require("../models/FleetModel");
const VesselModelDeployment = require("../models/VesselModelDeployment");
const { predictProbability } = require("./mlTraining.service");

const cache = new Map(); const CACHE_MS = 30000;
const inferActiveModel = async (module, features, vesselId = null) => {
    const normalizedModule = String(module).toUpperCase(); const key = `${normalizedModule}:${vesselId || "fleet"}`; const cached = cache.get(key);
    let model = cached?.expiresAt > Date.now() ? cached.model : null;
    if (!model && vesselId) {
        const deployment = await VesselModelDeployment.findOne({ vessel: vesselId, status: { $in: ["APPLIED", "ROLLED_BACK"] }, modelKey: `${normalizedModule}_SUPERVISED_MODEL`, currentVersion: { $ne: null } }).lean();
        if (deployment) model = await FleetModel.findOne({ modelKey: deployment.modelKey, version: deployment.currentVersion, learningType: "TRAINED_MODEL", artifact: { $ne: null } }).lean();
        cache.set(key, { model, expiresAt: Date.now() + CACHE_MS });
    } else if (!model) {
        model = await FleetModel.findOne({ module: normalizedModule, learningType: "TRAINED_MODEL", status: "ACTIVE", artifact: { $ne: null } }).sort({ version: -1 }).lean();
        cache.set(key, { model, expiresAt: Date.now() + CACHE_MS });
    }
    if (!model?.artifact) return null;
    return { probability: predictProbability(model.artifact, features), modelKey: model.modelKey, version: model.version, artifactHash: model.artifactHash };
};
const clearModelCache = () => cache.clear();
module.exports = { inferActiveModel, clearModelCache };
