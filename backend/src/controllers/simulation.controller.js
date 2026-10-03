const mongoose = require("mongoose");
const SimulationSession = require("../models/SimulationSession");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { emitVesselEvent } = require("../services/realtime.service");

const requireVesselAccess = async (req, res) => {
    const vesselId = req.body?.vessel || req.params?.vesselId;
    if (!mongoose.isValidObjectId(vesselId)) {
        res.status(400).json({ success: false, message: "A valid vessel id is required" });
        return null;
    }
    if (!canAccessVessel(req, vesselId)) {
        res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        return null;
    }
    const vessel = await Vessel.findOne({ _id: vesselId, isActive: true });
    if (!vessel) {
        res.status(404).json({ success: false, message: "Vessel not found or inactive" });
        return null;
    }
    return vessel;
};

const populatedSession = (id) => SimulationSession.findById(id)
    .populate("vessel", "name vesselId status riskScore riskLevel route destination")
    .lean();

const emitSession = (req, session) => {
    const vesselId = session.vessel?._id || session.vessel;
    emitVesselEvent(req.app.get("io"), "simulation:update", session, vesselId);
};

const getSessions = async (req, res) => {
    try {
        const sessions = await SimulationSession.find(vesselScope(req))
            .populate("vessel", "name vesselId status riskScore riskLevel route destination")
            .sort({ updatedAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: sessions.length, sessions });
    } catch (error) {
        console.error("Get simulation sessions error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch simulation sessions" });
    }
};

const getVesselSession = async (req, res) => {
    try {
        const vessel = await requireVesselAccess(req, res);
        if (!vessel) return;
        const session = await SimulationSession.findOne({ vessel: vessel._id })
            .populate("vessel", "name vesselId status riskScore riskLevel route destination")
            .lean();
        res.status(200).json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch simulation session" });
    }
};

const startVoyage = async (req, res) => {
    try {
        const vessel = await requireVesselAccess(req, res);
        if (!vessel) return;
        const current = await VesselCurrentState.findOne({ vessel: vessel._id }).lean();
        const latitude = Number(req.body.latitude ?? current?.latitude ?? vessel.latitude);
        const longitude = Number(req.body.longitude ?? current?.longitude ?? vessel.longitude);
        const speed = Number(req.body.speed ?? current?.speed ?? vessel.speed ?? 10) || 10;
        const heading = Number(req.body.heading ?? current?.heading ?? vessel.heading ?? 90);
        const destinationLatitude = Number(req.body.destinationLatitude ?? 25.276987);
        const destinationLongitude = Number(req.body.destinationLongitude ?? 55.296249);
        if (![latitude, longitude, speed, heading, destinationLatitude, destinationLongitude].every(Number.isFinite)) {
            return res.status(400).json({ success: false, message: "Voyage coordinates, speed and heading must be valid numbers" });
        }

        const session = await SimulationSession.findOneAndUpdate(
            { vessel: vessel._id },
            {
                $set: {
                    status: "RUNNING",
                    actual: { latitude, longitude, speed, heading },
                    route: {
                        origin: { name: vessel.route?.origin || "Current position", latitude, longitude },
                        destination: {
                            name: req.body.destinationName || vessel.route?.destination || vessel.destination || "Dubai",
                            latitude: destinationLatitude,
                            longitude: destinationLongitude,
                        },
                    },
                    attack: { type: "NONE", active: false, offsetLatitude: 0, offsetLongitude: 0, injectedAt: null },
                    hardware: { greenLed: true, redLed: false, buzzer: false },
                    startedBy: req.user.userId,
                    startedAt: new Date(),
                    stoppedAt: null,
                    lastTickAt: new Date(),
                },
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        const responseSession = await populatedSession(session._id);
        res.locals.auditVesselId = String(vessel._id);
        res.locals.auditResourceId = String(session._id);
        emitSession(req, responseSession);
        res.status(200).json({ success: true, message: "Voyage simulation started", session: responseSession });
    } catch (error) {
        console.error("Start voyage error:", error);
        res.status(400).json({ success: false, message: error.message || "Failed to start voyage" });
    }
};

const stopVoyage = async (req, res) => {
    try {
        const vessel = await requireVesselAccess(req, res);
        if (!vessel) return;
        const session = await SimulationSession.findOneAndUpdate(
            { vessel: vessel._id },
            { $set: { status: "IDLE", stoppedAt: new Date() } },
            { new: true, runValidators: true }
        );
        if (!session) return res.status(404).json({ success: false, message: "Start the voyage first" });
        const responseSession = await populatedSession(session._id);
        res.locals.auditVesselId = String(vessel._id);
        res.locals.auditResourceId = String(session._id);
        emitSession(req, responseSession);
        res.status(200).json({ success: true, message: "Voyage simulation stopped", session: responseSession });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to stop voyage" });
    }
};

const injectGpsSpoofing = async (req, res) => {
    try {
        const vessel = await requireVesselAccess(req, res);
        if (!vessel) return;
        const distanceMeters = Math.min(Math.max(Number(req.body.distanceMeters) || 650, 100), 5000);
        const direction = String(req.body.direction || "NORTH").toUpperCase();
        const latitudeOffset = distanceMeters / 111320;
        const longitudeScale = 111320 * Math.max(Math.cos((vessel.latitude * Math.PI) / 180), 0.2);
        const longitudeOffset = distanceMeters / longitudeScale;
        const offsets = {
            NORTH: [latitudeOffset, 0], SOUTH: [-latitudeOffset, 0],
            EAST: [0, longitudeOffset], WEST: [0, -longitudeOffset],
        };
        if (!offsets[direction]) return res.status(400).json({ success: false, message: "direction must be NORTH, SOUTH, EAST or WEST" });
        const session = await SimulationSession.findOneAndUpdate(
            { vessel: vessel._id, status: "RUNNING" },
            {
                $set: {
                    "attack.type": "GPS_SPOOFING",
                    "attack.active": true,
                    "attack.offsetLatitude": offsets[direction][0],
                    "attack.offsetLongitude": offsets[direction][1],
                    "attack.injectedAt": new Date(),
                },
            },
            { new: true, runValidators: true }
        );
        if (!session) return res.status(409).json({ success: false, message: "Start the voyage before injecting an attack" });
        const responseSession = await populatedSession(session._id);
        res.locals.auditVesselId = String(vessel._id);
        res.locals.auditResourceId = String(session._id);
        emitSession(req, responseSession);
        res.status(200).json({ success: true, message: `GPS spoofing injected ${distanceMeters} metres ${direction.toLowerCase()}`, session: responseSession });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to inject GPS spoofing" });
    }
};

const resetSimulation = async (req, res) => {
    try {
        const vessel = await requireVesselAccess(req, res);
        if (!vessel) return;
        const session = await SimulationSession.findOneAndUpdate(
            { vessel: vessel._id },
            {
                $set: {
                    attack: { type: "NONE", active: false, offsetLatitude: 0, offsetLongitude: 0, injectedAt: null },
                    hardware: { greenLed: true, redLed: false, buzzer: false },
                },
            },
            { new: true, runValidators: true }
        );
        if (!session) return res.status(404).json({ success: false, message: "Simulation session not found" });
        const responseSession = await populatedSession(session._id);
        res.locals.auditVesselId = String(vessel._id);
        res.locals.auditResourceId = String(session._id);
        emitSession(req, responseSession);
        res.status(200).json({ success: true, message: "Spoofing signal and simulated hardware alert reset", session: responseSession });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to reset simulation" });
    }
};

module.exports = { getSessions, getVesselSession, startVoyage, stopVoyage, injectGpsSpoofing, resetSimulation };
