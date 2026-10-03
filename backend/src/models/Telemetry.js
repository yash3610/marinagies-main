const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            trim: true,
            maxlength: 128,
        },

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

        source: {
            type: String,
            enum: ["SENSOR_AGENT", "NMEA", "AIS", "MANUAL", "SIMULATOR", "API"],
            default: "API",
        },

        sensorNode: {
            deviceId: { type: String, trim: true, maxlength: 100 },
            firmwareVersion: { type: String, trim: true, maxlength: 50 },
        },

        motion: {
            accelerometer: {
                x: { type: Number, min: -16, max: 16 },
                y: { type: Number, min: -16, max: 16 },
                z: { type: Number, min: -16, max: 16 },
            },
            gyroscope: {
                x: { type: Number, min: -2000, max: 2000 },
                y: { type: Number, min: -2000, max: 2000 },
                z: { type: Number, min: -2000, max: 2000 },
            },
            temperature: { type: Number, min: -40, max: 125 },
            motionDetected: { type: Boolean },
        },

        navigationReference: {
            aisLatitude: { type: Number, min: -90, max: 90 },
            aisLongitude: { type: Number, min: -180, max: 180 },
            gyroHeading: { type: Number, min: 0, max: 360 },
            simulatedSpeed: { type: Number, min: 0, max: 100 },
        },

        receivedAt: {
            type: Date,
            default: Date.now,
            immutable: true,
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
telemetrySchema.index({ eventId: 1 }, { unique: true, sparse: true });
telemetrySchema.index({ source: 1, timestamp: -1 });

// Telemetry is an append-only event stream. Updates and deletes must not be used
// by application code; the separate VesselCurrentState model stores the latest value.

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

module.exports = Telemetry;
