const OfflineQueueEvent = require("../models/OfflineQueueEvent");
const { connectivityOverview, setConnectivityMode, syncQueuedEvents } = require("../services/connectivity.service");
const { vesselScope } = require("../utils/dataScope");

const getOverview = async (req, res) => {
    try {
        const overview = await connectivityOverview(vesselScope(req));
        res.json({ success: true, ...overview });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load connectivity status" });
    }
};

const getQueue = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 500);
        const status = req.query.status ? String(req.query.status).toUpperCase() : null;
        const allowed = ["PENDING", "SYNCING", "SYNCED", "FAILED"];
        if (status && !allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid queue status" });
        const filter = { ...(status ? { status } : {}), ...vesselScope(req) };
        const [events, total] = await Promise.all([
            OfflineQueueEvent.find(filter).select("-payload").populate("vessel", "name vesselId").sort({ priority: -1, queuedAt: 1 }).limit(limit).lean(),
            OfflineQueueEvent.countDocuments(filter),
        ]);
        res.json({ success: true, total, events });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load offline queue" });
    }
};

const updateMode = async (req, res) => {
    try {
        const state = await setConnectivityMode({ mode: req.body?.mode, reason: req.body?.reason, userId: req.user.userId });
        const reconnectSync = state.mode === "OFFLINE" ? { synced: 0, eventIds: [] } : await syncQueuedEvents({ limit: 500 });
        res.locals.auditResourceId = state._id;
        req.app.get("io")?.emit("connectivity:update", { mode: state.mode, reason: state.reason, changedAt: state.changedAt });
        res.json({ success: true, message: `Connectivity changed to ${state.mode}; ${reconnectSync.synced} event(s) synchronized`, state, reconnectSync });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || "Failed to change connectivity" });
    }
};

const syncQueue = async (req, res) => {
    try {
        const result = await syncQueuedEvents({ limit: req.body?.limit });
        req.app.get("io")?.emit("connectivity:sync", { ...result, syncedAt: new Date().toISOString() });
        res.json({ success: true, message: `${result.synced} queued event(s) synchronized`, ...result });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || "Queue synchronization failed" });
    }
};

module.exports = { getOverview, getQueue, updateMode, syncQueue };
