const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        alertId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        vessel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vessel",
            required: true,
        },

        type: {
            type: String,
            required: true,
            enum: [
                "GPS_SPOOFING",
                "AIS_ANOMALY",
                "ROUTE_DEVIATION",
                "NAVIGATION_ANOMALY",
                "CYBER_ATTACK",
                "UNAUTHORIZED_ACCESS",
                "DEVICE_FAILURE",
                "SYSTEM_ANOMALY",
            ],
        },

        severity: {
            type: String,
            required: true,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE"],
            default: "OPEN",
        },

        source: {
            type: String,
            enum: [
                "AI_ENGINE",
                "EDGE_AGENT",
                "AIS",
                "GPS",
                "ESP32",
                "SYSTEM",
                "MANUAL",
            ],
            default: "SYSTEM",
        },

        confidence: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        module: { type: String, default: "SYSTEM", trim: true },
        confidenceLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW" },
        explanation: { type: mongoose.Schema.Types.Mixed, default: null },
        evidence: { type: mongoose.Schema.Types.Mixed, default: null },
        explanationFeedback: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            role: { type: String, required: true, trim: true },
            helpful: { type: Boolean, required: true },
            note: { type: String, trim: true, maxlength: 500, default: "" },
            createdAt: { type: Date, default: Date.now },
        }],
        detectionEvent: { type: mongoose.Schema.Types.ObjectId, ref: "GhostTraceEvent", default: null },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        detectedAt: {
            type: Date,
            default: Date.now,
        },

        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

alertSchema.index({ vessel: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ detectedAt: -1 });

alertSchema.pre("validate", function ensureMandatoryExplanation() {
    const { ensureExplanation } = require("../services/explanation.service");
    this.explanation = ensureExplanation(this);
});

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;
