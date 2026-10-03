const mongoose = require("mongoose");

const mlTrainingRunSchema = new mongoose.Schema({
    runId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    module: { type: String, enum: ["GHOSTTRACE", "AGENTWATCH", "EDGEARMOR", "ROCSHIELD"], required: true, index: true },
    algorithm: { type: String, default: "LOGISTIC_REGRESSION_GRADIENT_DESCENT" },
    seed: { type: Number, required: true },
    dataset: {
        name: { type: String, required: true }, sampleCount: { type: Number, required: true, min: 100 },
        trainingCount: { type: Number, required: true }, holdoutCount: { type: Number, required: true },
        positiveCount: { type: Number, required: true }, negativeCount: { type: Number, required: true },
        featureNames: [{ type: String, required: true }], hash: { type: String, required: true }, simulated: { type: Boolean, default: true },
    },
    metrics: {
        accuracy: Number, precision: Number, recall: Number, f1: Number, specificity: Number, falsePositiveRate: Number,
        confusionMatrix: { truePositive: Number, trueNegative: Number, falsePositive: Number, falseNegative: Number },
    },
    thresholds: { precision: { type: Number, default: 0.9 }, recall: { type: Number, default: 0.85 } },
    status: { type: String, enum: ["PASSED", "FAILED"], required: true, index: true },
    artifactHash: { type: String, required: true },
    fleetModel: { type: mongoose.Schema.Types.ObjectId, ref: "FleetModel", default: null },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    durationMs: { type: Number, required: true, min: 0 },
}, { timestamps: true });

mlTrainingRunSchema.index({ module: 1, createdAt: -1 });
module.exports = mongoose.model("MLTrainingRun", mlTrainingRunSchema);
