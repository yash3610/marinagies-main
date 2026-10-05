const GhostTraceEvent = require("../models/GhostTraceEvent");
const GhostTracePolicy = require("../models/GhostTracePolicy");
const VesselNavigationBaseline = require("../models/VesselNavigationBaseline");
const { vesselScope } = require("../utils/dataScope");
const { getPolicy, clearGhostTraceCaches } = require("../services/ghostTraceBaseline.service");

const getEvents = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 500);
        const filter = {
            ...vesselScope(req),
            ...(req.query.detected === undefined ? {} : { detected: req.query.detected === "true" }),
        };
        const events = await GhostTraceEvent.find(filter)
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .populate("alert", "alertId severity status title")
            .populate("incident", "incidentId severity status title")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        res.status(200).json({ success: true, count: events.length, events });
    } catch (error) {
        console.error("Get GhostTrace events error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch GhostTrace events" });
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await GhostTraceEvent.findOne({ _id: req.params.id, ...vesselScope(req) })
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .populate("alert")
            .populate("incident")
            .lean();
        if (!event) return res.status(404).json({ success: false, message: "GhostTrace event not found" });
        res.status(200).json({ success: true, event });
    } catch (error) {
        res.status(400).json({ success: false, message: "Invalid GhostTrace event id" });
    }
};

const getConfiguration = async (req, res) => {
    try {
        const [policy, baselines] = await Promise.all([
            getPolicy(),
            VesselNavigationBaseline.find(vesselScope(req)).populate("vessel", "name vesselId vesselType ghostTracePolicy").sort({ refreshedAt: -1 }).lean(),
        ]);
        res.json({ success: true, policy, baselines });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load GhostTrace configuration" });
    }
};

const updateConfiguration = async (req, res) => {
    try {
        const allowedTypes = ["CONTAINER", "TANKER", "CARGO", "BULK_CARRIER", "PASSENGER", "OTHER"];
        const classThresholds = {};
        for (const type of allowedTypes) {
            const value = Number(req.body?.classThresholds?.[type]);
            if (!Number.isFinite(value) || value < 0.5 || value > 0.95) {
                return res.status(400).json({ success: false, message: `${type} threshold must be between 0.50 and 0.95` });
            }
            classThresholds[type] = value;
        }
        const current = await getPolicy();
        const slowDrift = {
            windowHours: req.body?.slowDrift?.windowHours ?? current.slowDrift.windowHours,
            minimumSamples: req.body?.slowDrift?.minimumSamples ?? current.slowDrift.minimumSamples,
            minimumDurationMinutes: req.body?.slowDrift?.minimumDurationMinutes ?? current.slowDrift.minimumDurationMinutes,
            minimumNetDriftMeters: req.body?.slowDrift?.minimumNetDriftMeters ?? current.slowDrift.minimumNetDriftMeters,
            minimumSlopeMetersPerHour: req.body?.slowDrift?.minimumSlopeMetersPerHour ?? current.slowDrift.minimumSlopeMetersPerHour,
        };
        const policy = await GhostTracePolicy.findOneAndUpdate(
            { key: "DEFAULT" },
            { $set: { classThresholds, slowDrift, updatedBy: req.user.userId } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        clearGhostTraceCaches();
        res.locals.auditResourceId = policy._id.toString();
        res.json({ success: true, message: "GhostTrace thresholds updated", policy });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to update GhostTrace configuration" });
    }
};

module.exports = { getEvents, getEventById, getConfiguration, updateConfiguration };
