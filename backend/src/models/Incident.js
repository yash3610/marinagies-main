const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
    {
        incidentId: {
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

        alert: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Alert",
            default: null,
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
                "OTHER",
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

        description: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "OPEN",
                "INVESTIGATING",
                "CONTAINED",
                "RESOLVED",
                "CLOSED",
            ],
            default: "OPEN",
        },

        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            default: "MEDIUM",
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
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

        closedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

incidentSchema.index({ vessel: 1 });
incidentSchema.index({ alert: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ detectedAt: -1 });

const Incident = mongoose.model("Incident", incidentSchema);

module.exports = Incident;