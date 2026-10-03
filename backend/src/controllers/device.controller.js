const mongoose = require("mongoose");
const EdgeDevice = require("../models/EdgeDevice");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { emitVesselEvent } = require("../services/realtime.service");
const { applyMockFault } = require("../services/edgeArmor.service");

const populateDevice = (query) => query
    .populate("vessel", "name vesselId status riskScore riskLevel")
    .populate("quarantine.quarantinedBy", "name email role")
    .populate("quarantine.releasedBy", "name email role");

const getDevices = async (req, res) => {
    try {
        const filter = { ...vesselScope(req) };
        if (req.query.vessel) {
            if (!mongoose.isValidObjectId(req.query.vessel) || !canAccessVessel(req, req.query.vessel)) {
                return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
            }
            filter.vessel = req.query.vessel;
        }
        if (["ONLINE", "WARNING", "OFFLINE"].includes(req.query.status)) filter.status = req.query.status;
        const devices = await populateDevice(EdgeDevice.find(filter).sort({ "health.riskScore": -1, lastHeartbeatAt: -1 })).lean();
        res.status(200).json({ success: true, count: devices.length, devices });
    } catch (error) {
        console.error("Get edge devices error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch edge devices" });
    }
};

const registerDevice = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const approvedFirmware = String(req.body.approvedFirmware || "unknown").trim();
        const device = await EdgeDevice.create({
            deviceId: req.body.deviceId,
            vessel: req.body.vessel,
            name: req.body.name,
            type: req.body.type || "OTHER",
            source: req.body.source || "MANUAL",
            criticality: req.body.criticality || "STANDARD",
            approvedFirmware,
            reportedFirmware: approvedFirmware,
        });
        res.locals.auditVesselId = String(device.vessel);
        res.locals.auditResourceId = String(device._id);
        const populated = await populateDevice(EdgeDevice.findById(device._id)).lean();
        emitVesselEvent(req.app.get("io"), "edge-device:update", populated, device.vessel);
        res.status(201).json({ success: true, message: "Edge device registered", device: populated });
    } catch (error) {
        const duplicate = error?.code === 11000;
        res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? "Device ID is already registered" : error.message });
    }
};

const quarantineDevice = async (req, res) => {
    try {
        const device = await EdgeDevice.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!device) return res.status(404).json({ success: false, message: "Edge device not found" });
        if (device.containmentState === "QUARANTINED") return res.status(409).json({ success: false, message: "Device is already quarantined" });
        if (device.criticality === "SAFETY_CRITICAL" && req.body.confirmSafetyImpact !== true) {
            return res.status(409).json({ success: false, message: "Safety-critical quarantine requires explicit safety-impact confirmation" });
        }
        const reason = String(req.body.reason || "").trim();
        if (reason.length < 10) return res.status(400).json({ success: false, message: "A quarantine reason of at least 10 characters is required" });
        device.containmentState = "QUARANTINED";
        device.quarantine = { reason, quarantinedAt: new Date(), quarantinedBy: req.user.userId, releasedAt: null, releasedBy: null };
        await device.save();
        res.locals.auditVesselId = String(device.vessel);
        res.locals.auditResourceId = String(device._id);
        const populated = await populateDevice(EdgeDevice.findById(device._id)).lean();
        emitVesselEvent(req.app.get("io"), "edge-device:update", populated, device.vessel);
        res.status(200).json({ success: true, message: "Device quarantined; telemetry remains visible but is not trusted", device: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to quarantine device" });
    }
};

const releaseDevice = async (req, res) => {
    try {
        const device = await EdgeDevice.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!device) return res.status(404).json({ success: false, message: "Edge device not found" });
        if (device.containmentState !== "QUARANTINED") return res.status(409).json({ success: false, message: "Device is not quarantined" });
        device.containmentState = "ACTIVE";
        device.quarantine.releasedAt = new Date();
        device.quarantine.releasedBy = req.user.userId;
        await device.save();
        res.locals.auditVesselId = String(device.vessel);
        res.locals.auditResourceId = String(device._id);
        const populated = await populateDevice(EdgeDevice.findById(device._id)).lean();
        emitVesselEvent(req.app.get("io"), "edge-device:update", populated, device.vessel);
        res.status(200).json({ success: true, message: "Device released from quarantine", device: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to release device" });
    }
};

const simulateDeviceFault = async (req, res) => {
    try {
        const device = await EdgeDevice.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!device) return res.status(404).json({ success: false, message: "Edge device not found" });
        if (device.source !== "SIMULATED") return res.status(409).json({ success: false, message: "Fault injection is limited to simulated devices" });
        const result = await applyMockFault({ device, fault: req.body.fault, io: req.app.get("io") });
        res.locals.auditVesselId = String(device.vessel);
        res.locals.auditResourceId = String(device._id);
        const populated = await populateDevice(EdgeDevice.findById(device._id)).lean();
        res.status(200).json({ success: true, message: `${req.body.fault} fault injected`, device: populated, analysis: result.analysis, alert: result.alert });
    } catch (error) {
        res.status(error.status || 400).json({ success: false, message: error.message || "Failed to simulate device fault" });
    }
};

module.exports = { getDevices, registerDevice, quarantineDevice, releaseDevice, simulateDeviceFault };
