const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema(
    {
        vessel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vessel",
            required: true,
        },

        speed: {
            type: Number,
            default: 0,
            min: 0,
        },

        heading: {
            type: Number,
            default: 0,
            min: 0,
            max: 360,
        },

        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
        },

        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
        },

        depth: {
            type: Number,
            default: 0,
            min: 0,
        },

        gpsSignal: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        aisStatus: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "ANOMALY"],
            default: "ACTIVE",
        },

        deviceStatus: {
            type: String,
            enum: ["ONLINE", "OFFLINE", "WARNING"],
            default: "ONLINE",
        },

        engineTemperature: {
            type: Number,
            default: 0,
        },

        fuelLevel: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

telemetrySchema.index({ vessel: 1, timestamp: -1 });

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

module.exports = Telemetry;