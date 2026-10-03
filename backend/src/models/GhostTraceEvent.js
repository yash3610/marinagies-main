const mongoose = require("mongoose");

const ghostTraceEventSchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    telemetry: { type: mongoose.Schema.Types.ObjectId, ref: "Telemetry", required: true, unique: true },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", default: null },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
    detected: { type: Boolean, required: true, index: true },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },
    confidenceLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    alertType: {
        type: String,
        enum: ["GPS_POSITION_INCONSISTENT", "AIS_CROSS_REFERENCE_FAIL", "IMPLAUSIBLE_TRAJECTORY", "SIGNALS_CONSISTENT"],
        required: true,
    },
    signalsEvaluated: { type: mongoose.Schema.Types.Mixed, required: true },
    anomalyScores: { type: mongoose.Schema.Types.Mixed, required: true },
    explanation: {
        whatHappened: { type: String, required: true },
        whyItMatters: { type: String, required: true },
        whatCausedIt: { type: String, required: true },
        recommendedAction: { type: String, required: true },
    },
    threshold: { type: Number, required: true, min: 0, max: 1 },
}, { timestamps: true });

ghostTraceEventSchema.index({ vessel: 1, createdAt: -1 });

module.exports = mongoose.model("GhostTraceEvent", ghostTraceEventSchema);
