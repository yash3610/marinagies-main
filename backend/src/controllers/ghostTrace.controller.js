const GhostTraceEvent = require("../models/GhostTraceEvent");
const { vesselScope } = require("../utils/dataScope");

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

module.exports = { getEvents, getEventById };
