const FleetModel = require("../models/FleetModel");
const VesselModelDeployment = require("../models/VesselModelDeployment");
const { predictProbability } = require("./mlTraining.service");
const { predictPythonModel } = require("./pythonMlClient.service");

const cache = new Map(); const CACHE_MS = 30000;
const inferActiveModel = async (module, features, vesselId = null) => {
    const normalizedModule = String(module).toUpperCase(); const key = `${normalizedModule}:${vesselId || "fleet"}`; const cached = cache.get(key);
    let model = cached?.expiresAt > Date.now() ? cached.model : null;
    if (!model && vesselId) {
        const deployment = await VesselModelDeployment.findOne({ vessel: vesselId, status: { $in: ["APPLIED", "ROLLED_BACK"] }, modelKey: { $in: [`${normalizedModule}_SPECIALIZED_MODEL`, `${normalizedModule}_SUPERVISED_MODEL`] }, currentVersion: { $ne: null } }).sort({ updatedAt: -1 }).lean();
        if (deployment) model = await FleetModel.findOne({ modelKey: deployment.modelKey, version: deployment.currentVersion, learningType: "TRAINED_MODEL", artifact: { $ne: null } }).lean();
        cache.set(key, { model, expiresAt: Date.now() + CACHE_MS });
    } else if (!model) {
        model = await FleetModel.findOne({ module: normalizedModule, learningType: "TRAINED_MODEL", status: "ACTIVE", artifact: { $ne: null } }).sort({ version: -1 }).lean();
        cache.set(key, { model, expiresAt: Date.now() + CACHE_MS });
    }
    if (!model?.artifact) return null;
    if (model.artifact.engine === "PYTHON_SPECIALIZED") {
        try {
            const prediction = await predictPythonModel({ module: normalizedModule, modelId: model.artifact.pythonModelId, features });
            return { probability: prediction.probability, modelKey: model.modelKey, version: model.version, artifactHash: model.artifactHash, engine: "PYTHON_SPECIALIZED", algorithm: prediction.algorithm, componentScores: prediction.explanation?.component_scores || {} };
        } catch (error) {
            console.error(`Python ML inference fallback for ${normalizedModule}:`, error.message);
            return null;
        }
    }
    return { probability: predictProbability(model.artifact, features), modelKey: model.modelKey, version: model.version, artifactHash: model.artifactHash, engine: "NODE_BASELINE", algorithm: model.artifact.algorithm };
};
const clearModelCache = () => cache.clear();
module.exports = { inferActiveModel, clearModelCache };
