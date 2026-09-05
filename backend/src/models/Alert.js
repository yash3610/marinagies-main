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
            enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED"],
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

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;