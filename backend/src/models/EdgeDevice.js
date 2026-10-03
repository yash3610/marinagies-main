const mongoose = require("mongoose");

const edgeDeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 100 },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: {
        type: String,
        enum: ["ESP32_MPU6050", "NAVIGATION_SENSOR", "NETWORK_GATEWAY", "ENGINE_SENSOR", "OTHER"],
        default: "ESP32_MPU6050",
    },
    source: { type: String, enum: ["SIMULATED", "PHYSICAL", "MANUAL"], default: "SIMULATED" },
    criticality: { type: String, enum: ["STANDARD", "OPERATIONAL", "SAFETY_CRITICAL"], default: "OPERATIONAL" },
    status: { type: String, enum: ["ONLINE", "WARNING", "OFFLINE"], default: "OFFLINE", index: true },
    containmentState: { type: String, enum: ["ACTIVE", "QUARANTINED"], default: "ACTIVE", index: true },
    reportedFirmware: { type: String, default: "unknown", trim: true, maxlength: 50 },
    approvedFirmware: { type: String, default: "unknown", trim: true, maxlength: 50 },
    health: {
        score: { type: Number, min: 0, max: 100, default: 100 },
        riskScore: { type: Number, min: 0, max: 100, default: 0 },
        riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW" },
        reasons: [{ type: String, trim: true }],
        anomalyCodes: [{ type: String, trim: true }],
        signalStrength: { type: Number, min: 0, max: 100, default: 0 },
        batteryLevel: { type: Number, min: 0, max: 100, default: 100 },
        temperature: { type: Number, default: null },
        evaluatedAt: { type: Date, default: Date.now },
    },
    lastTelemetry: { type: mongoose.Schema.Types.ObjectId, ref: "Telemetry", default: null },
    lastHeartbeatAt: { type: Date, default: null, index: true },
    heartbeatCount: { type: Number, min: 0, default: 0 },
    lastAlertAt: { type: Date, default: null },
    mockFault: {
        type: { type: String, enum: ["HIGH_TEMPERATURE", "LOW_SIGNAL", "FIRMWARE_TAMPER", "HEARTBEAT_LOSS", null], default: null },
        injectedAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
    },
    quarantine: {
        reason: { type: String, default: "", trim: true, maxlength: 500 },
        quarantinedAt: { type: Date, default: null },
        quarantinedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        releasedAt: { type: Date, default: null },
        releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
}, { timestamps: true });

edgeDeviceSchema.index({ vessel: 1, status: 1 });
edgeDeviceSchema.index({ vessel: 1, "health.riskScore": -1 });

module.exports = mongoose.model("EdgeDevice", edgeDeviceSchema);
