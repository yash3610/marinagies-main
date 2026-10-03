const crypto = require("node:crypto");
const EdgeDevice = require("../models/EdgeDevice");
const Alert = require("../models/Alert");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");
const { syncEdgeDeviceAsset } = require("./fleetChoke.service");

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const riskLevelFor = (score) => score >= 80 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";

const evaluateDeviceHealth = ({
    deviceStatus = "ONLINE",
    signalStrength = 100,
    temperature = null,
    reportedFirmware = "unknown",
    approvedFirmware = "unknown",
    identityMismatch = false,
    heartbeatAgeSeconds = 0,
}) => {
    let riskScore = 0;
    const reasons = [];
    const anomalyCodes = [];
    const add = (points, code, reason) => {
        riskScore += points;
        anomalyCodes.push(code);
        reasons.push(reason);
    };
    if (identityMismatch) add(90, "DEVICE_ID_VESSEL_MISMATCH", "The device identifier was used by a different vessel.");
    if (deviceStatus === "OFFLINE" || heartbeatAgeSeconds > 120) add(55, "HEARTBEAT_MISSING", "No valid device heartbeat was received within 120 seconds.");
    else if (deviceStatus === "WARNING") add(25, "DEVICE_REPORTED_WARNING", "The edge node reported a warning state.");
    if (Number(signalStrength) < 20) add(20, "SIGNAL_CRITICAL", "Telemetry signal strength is below 20%.");
    else if (Number(signalStrength) < 45) add(10, "SIGNAL_WEAK", "Telemetry signal strength is below 45%.");
    if (Number.isFinite(Number(temperature)) && Number(temperature) > 70) add(35, "TEMPERATURE_CRITICAL", "Sensor temperature is above 70 C.");
    else if (Number.isFinite(Number(temperature)) && Number(temperature) > 55) add(15, "TEMPERATURE_HIGH", "Sensor temperature is above 55 C.");
    if (approvedFirmware !== "unknown" && reportedFirmware !== "unknown" && approvedFirmware !== reportedFirmware) {
        add(30, "FIRMWARE_MISMATCH", "Reported firmware does not match the approved version.");
    }
    riskScore = clamp(riskScore);
    return {
        riskScore,
        healthScore: 100 - riskScore,
        riskLevel: riskLevelFor(riskScore),
        reasons: reasons.length ? reasons : ["Heartbeat, firmware, signal and temperature checks passed."],
        anomalyCodes,
        effectiveStatus: riskScore >= 50 ? "OFFLINE" : riskScore >= 20 ? "WARNING" : "ONLINE",
    };
};

const createDeviceAlert = async ({ device, analysis, io }) => {
    const now = new Date();
    if (device.lastAlertAt && now - new Date(device.lastAlertAt) < 2 * 60 * 1000) return null;
    const severity = analysis.riskScore >= 80 ? "CRITICAL" : analysis.riskScore >= 50 ? "HIGH" : "MEDIUM";
    const alert = await Alert.create({
        alertId: `EA-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        vessel: device.vessel,
        type: "DEVICE_FAILURE",
        severity,
        title: `EdgeArmor: ${device.name} requires attention`,
        message: analysis.reasons.join(" "),
        source: "EDGE_AGENT",
        confidence: Math.max(60, analysis.riskScore),
        confidenceLevel: analysis.riskScore >= 70 ? "HIGH" : "MEDIUM",
        module: "EDGEARMOR",
        explanation: {
            whatHappened: `EdgeArmor detected ${analysis.anomalyCodes.length} device health anomaly signal(s).`,
            whyItMatters: "An unhealthy or tampered edge node can corrupt vessel telemetry and security decisions.",
            whatCausedIt: analysis.reasons.join(" "),
            recommendedAction: "Verify the physical node and firmware. Quarantine it if the anomaly cannot be explained.",
        },
        evidence: { device: device._id, deviceId: device.deviceId, anomalyCodes: analysis.anomalyCodes, riskScore: analysis.riskScore },
    });
    device.lastAlertAt = now;
    await device.save();
    emitVesselEvent(io, "alert:new", alert, device.vessel);
    writeAuditLog({
        actorRole: "EDGEARMOR_ENGINE",
        vessel: device.vessel,
        action: "EDGE_DEVICE_ANOMALY_DETECTED",
        resource: "EDGE_DEVICE",
        resourceId: String(device._id),
        description: analysis.reasons.join(" "),
        metadata: { riskScore: analysis.riskScore, anomalyCodes: analysis.anomalyCodes, alertId: alert.alertId },
    }).catch((error) => console.error("EdgeArmor audit error:", error.message));
    return alert;
};

const processEdgeArmorTelemetry = async ({ telemetry, vessel, io }) => {
    const rawDeviceId = telemetry.sensorNode?.deviceId;
    if (!rawDeviceId) return null;
    const deviceId = String(rawDeviceId).trim().toUpperCase();
    const existing = await EdgeDevice.findOne({ deviceId });
    const identityMismatch = Boolean(existing && String(existing.vessel) !== String(vessel._id));
    const activeFault = existing?.mockFault?.expiresAt > new Date() ? existing.mockFault.type : null;
    const actualFirmware = telemetry.sensorNode?.firmwareVersion || existing?.reportedFirmware || "unknown";
    const reportedFirmware = activeFault === "FIRMWARE_TAMPER" ? "unapproved-demo-build" : actualFirmware;
    const approvedFirmware = existing?.approvedFirmware || reportedFirmware;
    const analysis = evaluateDeviceHealth({
        deviceStatus: activeFault === "HEARTBEAT_LOSS" ? "OFFLINE" : activeFault ? "WARNING" : telemetry.deviceStatus,
        signalStrength: activeFault === "LOW_SIGNAL" || activeFault === "HEARTBEAT_LOSS" ? (activeFault === "LOW_SIGNAL" ? 8 : 0) : telemetry.gpsSignal,
        temperature: activeFault === "HIGH_TEMPERATURE" ? 82 : telemetry.motion?.temperature,
        reportedFirmware,
        approvedFirmware,
        identityMismatch,
        heartbeatAgeSeconds: activeFault === "HEARTBEAT_LOSS" ? 180 : 0,
    });
    const targetVessel = existing?.vessel || vessel._id;
    const device = await EdgeDevice.findOneAndUpdate(
        { deviceId },
        {
            $set: {
                vessel: targetVessel,
                name: existing?.name || `Marine Edge Node ${deviceId}`,
                source: telemetry.source === "SIMULATOR" ? "SIMULATED" : "PHYSICAL",
                status: analysis.effectiveStatus,
                reportedFirmware,
                approvedFirmware,
                lastTelemetry: telemetry._id,
                lastHeartbeatAt: telemetry.timestamp,
                "health.score": analysis.healthScore,
                "health.riskScore": analysis.riskScore,
                "health.riskLevel": analysis.riskLevel,
                "health.reasons": analysis.reasons,
                "health.anomalyCodes": analysis.anomalyCodes,
                "health.signalStrength": activeFault === "LOW_SIGNAL" || activeFault === "HEARTBEAT_LOSS" ? (activeFault === "LOW_SIGNAL" ? 8 : 0) : telemetry.gpsSignal,
                "health.temperature": activeFault === "HIGH_TEMPERATURE" ? 82 : telemetry.motion?.temperature ?? null,
                "health.evaluatedAt": new Date(),
                ...(activeFault ? {} : { "mockFault.type": null, "mockFault.injectedAt": null, "mockFault.expiresAt": null }),
            },
            $inc: { heartbeatCount: 1 },
            $setOnInsert: { type: "ESP32_MPU6050", criticality: "OPERATIONAL", containmentState: "ACTIVE" },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const populated = await EdgeDevice.findById(device._id).populate("vessel", "name vesselId status").lean();
    emitVesselEvent(io, "edge-device:update", populated, targetVessel);
    await syncEdgeDeviceAsset(device, io);
    const alert = analysis.riskScore >= 20 ? await createDeviceAlert({ device, analysis, io }) : null;
    return { device, analysis, alert };
};

const applyMockFault = async ({ device, fault, io }) => {
    const inputs = {
        HIGH_TEMPERATURE: { deviceStatus: "WARNING", signalStrength: 80, temperature: 82, reportedFirmware: device.reportedFirmware, approvedFirmware: device.approvedFirmware },
        LOW_SIGNAL: { deviceStatus: "WARNING", signalStrength: 8, temperature: device.health.temperature, reportedFirmware: device.reportedFirmware, approvedFirmware: device.approvedFirmware },
        FIRMWARE_TAMPER: { deviceStatus: "WARNING", signalStrength: 80, temperature: device.health.temperature, reportedFirmware: "unapproved-demo-build", approvedFirmware: device.approvedFirmware },
        HEARTBEAT_LOSS: { deviceStatus: "OFFLINE", signalStrength: 0, temperature: device.health.temperature, reportedFirmware: device.reportedFirmware, approvedFirmware: device.approvedFirmware, heartbeatAgeSeconds: 180 },
    };
    if (!inputs[fault]) throw Object.assign(new Error("Unsupported mock fault"), { status: 400 });
    const analysis = evaluateDeviceHealth(inputs[fault]);
    device.status = analysis.effectiveStatus;
    if (fault === "FIRMWARE_TAMPER") device.reportedFirmware = inputs[fault].reportedFirmware;
    device.mockFault = { type: fault, injectedAt: new Date(), expiresAt: new Date(Date.now() + 2 * 60 * 1000) };
    device.health = {
        ...device.health.toObject(), score: analysis.healthScore, riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel, reasons: analysis.reasons, anomalyCodes: analysis.anomalyCodes,
        signalStrength: inputs[fault].signalStrength, temperature: inputs[fault].temperature, evaluatedAt: new Date(),
    };
    await device.save();
    await syncEdgeDeviceAsset(device, io);
    const alert = await createDeviceAlert({ device, analysis, io });
    return { device, analysis, alert };
};

const checkStaleDevices = async (io, now = new Date()) => {
    const cutoff = new Date(now.getTime() - 120 * 1000);
    const devices = await EdgeDevice.find({ containmentState: "ACTIVE", lastHeartbeatAt: { $lt: cutoff }, status: { $ne: "OFFLINE" } });
    for (const device of devices) {
        const analysis = evaluateDeviceHealth({ deviceStatus: "OFFLINE", heartbeatAgeSeconds: 121 });
        device.status = "OFFLINE";
        device.health.score = analysis.healthScore;
        device.health.riskScore = analysis.riskScore;
        device.health.riskLevel = analysis.riskLevel;
        device.health.reasons = analysis.reasons;
        device.health.anomalyCodes = analysis.anomalyCodes;
        device.health.evaluatedAt = now;
        await device.save();
        await syncEdgeDeviceAsset(device, io);
        await createDeviceAlert({ device, analysis, io });
        emitVesselEvent(io, "edge-device:update", device, device.vessel);
    }
    return devices.length;
};

const startEdgeArmorMonitor = (io) => {
    const timer = setInterval(() => checkStaleDevices(io).catch((error) => console.error("EdgeArmor monitor error:", error.message)), 30000);
    timer.unref?.();
    return timer;
};

module.exports = { evaluateDeviceHealth, processEdgeArmorTelemetry, applyMockFault, checkStaleDevices, startEdgeArmorMonitor };
