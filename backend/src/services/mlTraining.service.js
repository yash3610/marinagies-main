const crypto = require("node:crypto");
const FleetModel = require("../models/FleetModel");
const MLTrainingRun = require("../models/MLTrainingRun");
const { writeAuditLog } = require("./audit.service");

const CONFIG = Object.freeze({
    GHOSTTRACE: { features: ["deadReckoning", "impossibleSpeed", "physicalMotionMismatch", "aisCrossReference", "headingMismatch", "speedMismatch"], positiveBias: [0.88, 0.72, 0.86, 0.78, 0.68, 0.64], negativeBias: [0.10, 0.06, 0.08, 0.09, 0.12, 0.10], target: "GPS spoofing anomaly" },
    AGENTWATCH: { features: ["stageCompleteness", "timingSpeed", "eventDiversity", "durationRisk", "credentialPressure", "privilegeSignal"], positiveBias: [0.94, 0.91, 0.82, 0.89, 0.76, 0.88], negativeBias: [0.28, 0.18, 0.30, 0.16, 0.20, 0.12], target: "machine-speed autonomous attack" },
    EDGEARMOR: { features: ["heartbeatAnomaly", "signalAnomaly", "temperatureAnomaly", "firmwareMismatch", "identityMismatch", "connectionDeviation"], positiveBias: [0.65, 0.62, 0.58, 0.72, 0.55, 0.78], negativeBias: [0.08, 0.12, 0.10, 0.05, 0.01, 0.12], target: "edge-device compromise" },
    ROCSHIELD: { features: ["routeDeviation", "operatorPattern", "environmentalContext", "timeAnomaly", "sequenceAnomaly", "authorityCheck"], positiveBias: [0.78, 0.82, 0.68, 0.72, 0.76, 0.84], negativeBias: [0.14, 0.22, 0.16, 0.20, 0.10, 0.02], target: "unsafe remote command" },
});

const seededRandom = (seed) => {
    let state = Number(seed) >>> 0;
    return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
};
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const hash = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const generateDataset = ({ module, sampleCount = 800, seed = 1701 }) => {
    const config = CONFIG[module];
    if (!config) throw Object.assign(new Error("Unsupported ML module"), { status: 400 });
    const count = Math.max(100, Math.min(5000, Number(sampleCount) || 800));
    const moduleSalt = [...module].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const random = seededRandom(Number(seed) + moduleSalt); const rows = [];
    for (let index = 0; index < count; index += 1) {
        const label = index % 2;
        const values = config.features.map((_, featureIndex) => {
            const center = label ? config.positiveBias[featureIndex] : config.negativeBias[featureIndex];
            const noise = (random() - 0.5) * (label ? 0.34 : 0.30);
            const confusing = random() < 0.045 ? (label ? -0.45 : 0.45) : 0;
            return round(clamp(center + noise + confusing));
        });
        const observedLabel = random() < 0.035 ? 1 - label : label;
        rows.push({ id: `${module}-${seed}-${index}`, values, label: observedLabel });
    }
    for (let index = rows.length - 1; index > 0; index -= 1) { const target = Math.floor(random() * (index + 1)); [rows[index], rows[target]] = [rows[target], rows[index]]; }
    return { module, seed, featureNames: config.features, rows, hash: hash(rows) };
};

const fitScaler = (rows, featureCount) => {
    const mean = Array(featureCount).fill(0); const std = Array(featureCount).fill(0);
    rows.forEach((row) => row.values.forEach((value, index) => { mean[index] += value / rows.length; }));
    rows.forEach((row) => row.values.forEach((value, index) => { std[index] += (value - mean[index]) ** 2 / rows.length; }));
    return { mean: mean.map((value) => round(value)), std: std.map((value) => round(Math.sqrt(value) || 1)) };
};
const scaleValues = (values, scaler) => values.map((value, index) => (Number(value) - scaler.mean[index]) / scaler.std[index]);
const sigmoid = (value) => value >= 0 ? 1 / (1 + Math.exp(-value)) : Math.exp(value) / (1 + Math.exp(value));

const trainLogisticRegression = ({ rows, featureNames, epochs = 900, learningRate = 0.08, l2 = 0.002 }) => {
    const scaler = fitScaler(rows, featureNames.length); const weights = Array(featureNames.length).fill(0); let intercept = 0;
    for (let epoch = 0; epoch < epochs; epoch += 1) {
        const gradients = Array(weights.length).fill(0); let interceptGradient = 0;
        rows.forEach((row) => {
            const values = scaleValues(row.values, scaler); const probability = sigmoid(intercept + values.reduce((sum, value, index) => sum + value * weights[index], 0)); const error = probability - row.label;
            values.forEach((value, index) => { gradients[index] += error * value; }); interceptGradient += error;
        });
        weights.forEach((weight, index) => { weights[index] -= learningRate * (gradients[index] / rows.length + l2 * weight); });
        intercept -= learningRate * interceptGradient / rows.length;
    }
    return { algorithm: "LOGISTIC_REGRESSION_GRADIENT_DESCENT", featureNames, weights: weights.map((value) => round(value)), intercept: round(intercept), scaler, threshold: 0.5, hyperparameters: { epochs, learningRate, l2 } };
};

const predictProbability = (artifact, featureInput) => {
    const values = Array.isArray(featureInput) ? featureInput : artifact.featureNames.map((name) => Number(featureInput[name] || 0));
    if (values.length !== artifact.featureNames.length || values.some((value) => !Number.isFinite(Number(value)))) throw new Error("Inference features do not match model artifact");
    const scaled = scaleValues(values, artifact.scaler); return round(sigmoid(artifact.intercept + scaled.reduce((sum, value, index) => sum + value * artifact.weights[index], 0)));
};

const evaluateArtifact = (artifact, rows) => {
    const confusion = { truePositive: 0, trueNegative: 0, falsePositive: 0, falseNegative: 0 };
    rows.forEach((row) => { const predicted = predictProbability(artifact, row.values) >= artifact.threshold ? 1 : 0; if (predicted && row.label) confusion.truePositive += 1; else if (!predicted && !row.label) confusion.trueNegative += 1; else if (predicted) confusion.falsePositive += 1; else confusion.falseNegative += 1; });
    const { truePositive: tp, trueNegative: tn, falsePositive: fp, falseNegative: fn } = confusion;
    const precision = tp + fp ? tp / (tp + fp) : 0; const recall = tp + fn ? tp / (tp + fn) : 0; const specificity = tn + fp ? tn / (tn + fp) : 0;
    return { accuracy: round((tp + tn) / rows.length), precision: round(precision), recall: round(recall), f1: round(precision + recall ? 2 * precision * recall / (precision + recall) : 0), specificity: round(specificity), falsePositiveRate: round(1 - specificity), confusionMatrix: confusion };
};

const runtimeFeatures = {
    GHOSTTRACE: (analysis) => ({ ...analysis.anomalyScores }),
    AGENTWATCH: (analysis) => ({
        stageCompleteness: clamp((analysis.stages?.length || 0) / 4), timingSpeed: clamp(1 - Number(analysis.medianIntervalMs || 45000) / 45000),
        eventDiversity: clamp(new Set(analysis.events?.map((event) => event.eventKind)).size / 8), durationRisk: clamp(1 - Number(analysis.durationMs || 180000) / 180000),
        credentialPressure: clamp((analysis.events?.filter((event) => event.eventKind === "AUTH_FAILURE").length || 0) / 5), privilegeSignal: analysis.events?.some((event) => event.eventKind === "PRIVILEGE_ESCALATION") ? 1 : 0,
    }),
    EDGEARMOR: (input) => ({ heartbeatAnomaly: input.deviceStatus === "OFFLINE" || input.heartbeatAgeSeconds > 120 ? 1 : 0, signalAnomaly: clamp((45 - Number(input.signalStrength || 0)) / 45), temperatureAnomaly: clamp((Number(input.temperature || 20) - 45) / 40), firmwareMismatch: input.reportedFirmware !== "unknown" && input.approvedFirmware !== "unknown" && input.reportedFirmware !== input.approvedFirmware ? 1 : 0, identityMismatch: input.identityMismatch ? 1 : 0, connectionDeviation: clamp(Number(input.connectionDeviation || 0)) }),
    ROCSHIELD: (result) => Object.fromEntries(Object.entries(result.riskFactors).map(([key, value]) => [key, value.score])),
};

const trainModuleModel = async ({ module, sampleCount, seed, actor }) => {
    const startedAt = Date.now(); const normalized = String(module || "").toUpperCase();
    const dataset = generateDataset({ module: normalized, sampleCount, seed: Number(seed) || 1701 });
    const splitIndex = Math.floor(dataset.rows.length * 0.75); const trainingRows = dataset.rows.slice(0, splitIndex); const holdoutRows = dataset.rows.slice(splitIndex);
    const artifact = trainLogisticRegression({ rows: trainingRows, featureNames: dataset.featureNames }); const metrics = evaluateArtifact(artifact, holdoutRows);
    const passed = metrics.precision >= 0.9 && metrics.recall >= 0.85; const modelKey = `${normalized}_SUPERVISED_MODEL`;
    const latest = await FleetModel.findOne({ modelKey }).sort({ version: -1 }).lean(); const artifactHash = hash(artifact);
    const modelCard = { purpose: CONFIG[normalized].target, trainingData: "Deterministic labelled maritime simulation; no production sensor data", limitations: ["Synthetic data may not represent every sea state, vessel class or adversary.", "Deterministic detector remains the fail-safe when no validated artifact is deployed.", "Specialized PRD architectures such as LSTM, autoencoder and XGBoost require a future Python ML runtime."], intendedUse: "Additional onboard risk signal; never the sole basis for an irreversible action", evaluation: { holdoutOnly: true, datasetHash: dataset.hash, ...metrics } };
    const model = await FleetModel.create({ modelKey, module: normalized, version: (latest?.version || 0) + 1, previousVersion: latest?.version || null, status: passed ? "VALIDATED" : "REJECTED", learningType: "TRAINED_MODEL", patternFingerprints: [], patternCount: dataset.rows.length, artifactHash, artifact, modelCard, validation: { precision: metrics.precision, recall: metrics.recall, f1: metrics.f1, dataset: `simulated-${normalized.toLowerCase()}-${dataset.seed}`, validatedAt: new Date(), validatedBy: actor }, createdBy: actor, notes: "Supervised baseline trained on a fixed labelled simulated dataset and evaluated on an unseen holdout partition" });
    const run = await MLTrainingRun.create({ runId: `MLR-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, module: normalized, seed: dataset.seed, dataset: { name: model.validation.dataset, sampleCount: dataset.rows.length, trainingCount: trainingRows.length, holdoutCount: holdoutRows.length, positiveCount: dataset.rows.filter((row) => row.label === 1).length, negativeCount: dataset.rows.filter((row) => row.label === 0).length, featureNames: dataset.featureNames, hash: dataset.hash, simulated: true }, metrics, status: passed ? "PASSED" : "FAILED", artifactHash, fleetModel: model._id, initiatedBy: actor, durationMs: Date.now() - startedAt });
    model.trainingRun = run._id; await model.save();
    await writeAuditLog({ user: actor, actorRole: "ML_TRAINING_OPERATOR", action: `ML_TRAINING_${run.status}`, resource: "ML_TRAINING_RUN", resourceId: String(run._id), description: `${normalized} v${model.version} trained and evaluated against an unseen holdout set`, metadata: { datasetHash: dataset.hash, artifactHash, metrics, simulatedDataset: true } });
    return { run, model };
};

module.exports = { CONFIG, seededRandom, generateDataset, trainLogisticRegression, predictProbability, evaluateArtifact, runtimeFeatures, trainModuleModel };
