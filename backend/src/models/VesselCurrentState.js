const mongoose = require("mongoose");

const vesselCurrentStateSchema = new mongoose.Schema(
    {
        vessel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vessel",
            required: true,
            unique: true,
        },
        telemetry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Telemetry",
            required: true,
        },
        eventId: { type: String, trim: true, maxlength: 128 },
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
        sourceTimestamp: { type: Date, required: true },
        receivedAt: { type: Date, required: true },
        speed: { type: Number, min: 0, default: 0 },
        heading: { type: Number, min: 0, max: 360, default: 0 },
        latitude: { type: Number, min: -90, max: 90, required: true },
        longitude: { type: Number, min: -180, max: 180, required: true },
        depth: { type: Number, min: 0, default: 0 },
        gpsSignal: { type: Number, min: 0, max: 100, default: 0 },
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
        engineTemperature: { type: Number, default: 0 },
        fuelLevel: { type: Number, min: 0, max: 100, default: 0 },
    },
    { timestamps: true }
);

vesselCurrentStateSchema.index({ sourceTimestamp: -1 });

module.exports = mongoose.model("VesselCurrentState", vesselCurrentStateSchema);
