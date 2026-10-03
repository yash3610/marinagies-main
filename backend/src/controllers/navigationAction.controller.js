const mongoose = require("mongoose");
const NavigationAction = require("../models/NavigationAction");
const TrustedNavigationState = require("../models/TrustedNavigationState");
const SimulationSession = require("../models/SimulationSession");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { runDigitalTwin, recordTrustedPosition } = require("../services/navigationResponse.service");
const { emitVesselEvent } = require("../services/realtime.service");

const populateAction = (query) => query
    .populate("vessel", "name vesselId status riskScore riskLevel route destination")
    .populate("alert", "alertId title severity status confidence explanation")
    .populate("incident", "incidentId title severity status")
    .populate("decision.decidedBy", "name email role");

const getActions = async (req, res) => {
    try {
        const filter = { ...vesselScope(req) };
        if (req.query.vessel) {
            if (!mongoose.isValidObjectId(req.query.vessel) || !canAccessVessel(req, req.query.vessel)) {
                return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
            }
            filter.vessel = req.query.vessel;
        }
        const actions = await populateAction(NavigationAction.find(filter).sort({ createdAt: -1 }).limit(200)).lean();
        res.status(200).json({ success: true, count: actions.length, actions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch navigation actions" });
    }
};

const getTrustedPosition = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.vesselId) || !canAccessVessel(req, req.params.vesselId)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const trustedPosition = await TrustedNavigationState.findOne({ vessel: req.params.vesselId })
            .populate("setBy", "name email role")
            .lean();
        res.status(200).json({ success: true, trustedPosition });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch trusted position" });
    }
};

const setTrustedPosition = async (req, res) => {
    try {
        const vesselId = req.body?.vessel;
        if (!mongoose.isValidObjectId(vesselId) || !canAccessVessel(req, vesselId)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const current = await VesselCurrentState.findOne({ vessel: vesselId }).lean();
        const latitude = Number(req.body.latitude ?? current?.navigationReference?.aisLatitude ?? current?.latitude);
        const longitude = Number(req.body.longitude ?? current?.navigationReference?.aisLongitude ?? current?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return res.status(400).json({ success: false, message: "A valid trusted latitude and longitude are required" });
        }
        const trustedPosition = await recordTrustedPosition({
            vesselId,
            setBy: req.user.userId,
            source: "MANUAL",
            reason: req.body.reason || "Authorized bridge officer manual trusted-position override",
            telemetry: {
                _id: current?.telemetry || null,
                latitude,
                longitude,
                speed: Number(req.body.speed ?? current?.navigationReference?.simulatedSpeed ?? current?.speed ?? 0),
                heading: Number(req.body.heading ?? current?.navigationReference?.gyroHeading ?? current?.heading ?? 0),
                timestamp: new Date(),
            },
        });
        res.locals.auditVesselId = vesselId;
        res.locals.auditResourceId = String(trustedPosition._id);
        res.status(200).json({ success: true, message: "Trusted position saved", trustedPosition });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to save trusted position" });
    }
};

const simulateAction = async (req, res) => {
    try {
        const action = await NavigationAction.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!action) return res.status(404).json({ success: false, message: "Navigation action not found" });
        if (["APPROVED", "APPLIED", "REJECTED"].includes(action.status)) {
            return res.status(409).json({ success: false, message: `Cannot simulate an action in ${action.status} state` });
        }
        await runDigitalTwin(action);
        const responseAction = await populateAction(NavigationAction.findById(action._id)).lean();
        res.locals.auditVesselId = String(action.vessel);
        res.locals.auditResourceId = String(action._id);
        emitVesselEvent(req.app.get("io"), "navigation-action:update", responseAction, action.vessel);
        res.status(200).json({ success: true, message: `Digital Twin result: ${action.digitalTwin.result}`, action: responseAction });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Digital Twin simulation failed" });
    }
};

const approveAction = async (req, res) => {
    try {
        const action = await NavigationAction.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!action) return res.status(404).json({ success: false, message: "Navigation action not found" });
        if (action.status !== "AWAITING_APPROVAL" || action.digitalTwin.result !== "SAFE") {
            return res.status(409).json({ success: false, message: "Only a Digital Twin SAFE action awaiting approval can be applied" });
        }
        const decidedAt = new Date();
        action.status = "APPLIED";
        action.decision = { decidedBy: req.user.userId, decidedAt, note: req.body.note || "Approved by authorized operator" };
        action.appliedAt = decidedAt;
        await action.save();

        const trusted = action.trustedPosition;
        const [session] = await Promise.all([
            SimulationSession.findOneAndUpdate(
                { vessel: action.vessel },
                {
                    $set: {
                        actual: { latitude: trusted.latitude, longitude: trusted.longitude, speed: trusted.speed, heading: trusted.heading },
                        attack: { type: "NONE", active: false, offsetLatitude: 0, offsetLongitude: 0, injectedAt: null },
                        hardware: { greenLed: true, redLed: false, buzzer: false },
                        navigationSource: "TRUSTED_POSITION",
                        safeMode: { active: true, enteredAt: decidedAt, enteredBy: req.user.userId, reason: action.reason },
                        lastTickAt: decidedAt,
                    },
                },
                { new: true, runValidators: true }
            ).populate("vessel", "name vesselId status riskScore riskLevel route destination"),
            Vessel.updateOne({ _id: action.vessel }, {
                $set: {
                    latitude: trusted.latitude,
                    longitude: trusted.longitude,
                    speed: trusted.speed,
                    heading: trusted.heading,
                    status: "WARNING",
                    riskScore: 35,
                    riskLevel: "MEDIUM",
                },
            }),
            action.alert ? Alert.updateOne({ _id: action.alert }, { $set: { status: "RESOLVED", resolvedAt: decidedAt, resolvedBy: req.user.userId } }) : null,
            action.incident ? Incident.updateOne({ _id: action.incident }, { $set: { status: "CONTAINED" } }) : null,
        ]);
        await recordTrustedPosition({
            vesselId: action.vessel,
            setBy: req.user.userId,
            source: "DIGITAL_TWIN",
            reason: "Digital Twin SAFE correction approved and applied",
            telemetry: { ...trusted.toObject(), timestamp: decidedAt },
        });

        const responseAction = await populateAction(NavigationAction.findById(action._id)).lean();
        res.locals.auditVesselId = String(action.vessel);
        res.locals.auditResourceId = String(action._id);
        emitVesselEvent(req.app.get("io"), "navigation-action:update", responseAction, action.vessel);
        if (session) emitVesselEvent(req.app.get("io"), "simulation:update", session, action.vessel);
        res.status(200).json({ success: true, message: "Trusted position applied and Safe Mode entered", action: responseAction, session });
    } catch (error) {
        console.error("Approve navigation action error:", error);
        res.status(400).json({ success: false, message: error.message || "Failed to apply navigation action" });
    }
};

const rejectAction = async (req, res) => {
    try {
        const action = await NavigationAction.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!action) return res.status(404).json({ success: false, message: "Navigation action not found" });
        if (!['PROPOSED', 'AWAITING_APPROVAL'].includes(action.status)) {
            return res.status(409).json({ success: false, message: `Cannot reject an action in ${action.status} state` });
        }
        action.status = "REJECTED";
        action.decision = { decidedBy: req.user.userId, decidedAt: new Date(), note: req.body.note || "Rejected by authorized operator" };
        await action.save();
        const responseAction = await populateAction(NavigationAction.findById(action._id)).lean();
        res.locals.auditVesselId = String(action.vessel);
        res.locals.auditResourceId = String(action._id);
        emitVesselEvent(req.app.get("io"), "navigation-action:update", responseAction, action.vessel);
        res.status(200).json({ success: true, message: "Navigation action rejected; no vessel state was changed", action: responseAction });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to reject navigation action" });
    }
};

const exitSafeMode = async (req, res) => {
    try {
        const vesselId = req.body?.vessel;
        if (!mongoose.isValidObjectId(vesselId) || !canAccessVessel(req, vesselId)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const session = await SimulationSession.findOneAndUpdate(
            { vessel: vesselId, "safeMode.active": true },
            { $set: { navigationSource: "GPS", safeMode: { active: false, enteredAt: null, enteredBy: null, reason: "" } } },
            { new: true, runValidators: true }
        ).populate("vessel", "name vesselId status riskScore riskLevel route destination");
        if (!session) return res.status(409).json({ success: false, message: "Safe Mode is not active" });
        await Vessel.updateOne({ _id: vesselId }, { $set: { status: "ONLINE", riskScore: 15, riskLevel: "LOW" } });
        await TrustedNavigationState.updateOne({ vessel: vesselId }, { $set: { locked: false } });
        res.locals.auditVesselId = vesselId;
        res.locals.auditResourceId = String(session._id);
        emitVesselEvent(req.app.get("io"), "simulation:update", session, vesselId);
        res.status(200).json({ success: true, message: "Safe Mode exited; GPS navigation source restored", session });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to exit Safe Mode" });
    }
};

module.exports = { getActions, getTrustedPosition, setTrustedPosition, simulateAction, approveAction, rejectAction, exitSafeMode };
