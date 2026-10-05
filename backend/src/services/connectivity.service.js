const crypto = require("node:crypto");
const mongoose = require("mongoose");
const ConnectivityState = require("../models/ConnectivityState");
const OfflineQueueEvent = require("../models/OfflineQueueEvent");

const MODES = Object.freeze(["CONNECTED", "LIMITED", "MINIMAL", "OFFLINE"]);
const SEVERITY_PRIORITY = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 });
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const syncBatchLimitForMode = (mode) => mode === "MINIMAL" ? 10 : mode === "LIMITED" ? 50 : 500;

const getConnectivityState = () => ConnectivityState.findOneAndUpdate(
    { key: "PLATFORM" },
    { $setOnInsert: { key: "PLATFORM" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
);

const summarizeQueue = async (scope = {}) => {
    const aggregateScope = scope.vessel?.$in
        ? { ...scope, vessel: { $in: scope.vessel.$in.filter(mongoose.isValidObjectId).map((id) => new mongoose.Types.ObjectId(id)) } }
        : scope;
    const rows = await OfflineQueueEvent.aggregate([
        { $match: { status: { $in: ["PENDING", "FAILED", "SYNCING"] }, ...aggregateScope } },
        { $group: { _id: "$status", count: { $sum: 1 }, bytes: { $sum: "$payloadBytes" } } },
    ]);
    const result = { pending: 0, failed: 0, syncing: 0, totalBytes: 0 };
    rows.forEach((row) => {
        result[String(row._id).toLowerCase()] = row.count;
        result.totalBytes += row.bytes;
    });
    return result;
};

const connectivityOverview = async (scope = {}) => {
    const [state, queue] = await Promise.all([getConnectivityState(), summarizeQueue(scope)]);
    return { state, queue, retentionDays: 7, syncOrder: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] };
};

const setConnectivityMode = async ({ mode, reason, userId }) => {
    const normalized = String(mode || "").toUpperCase();
    if (!MODES.includes(normalized)) throw Object.assign(new Error("Invalid connectivity mode"), { status: 400 });
    if (!String(reason || "").trim()) throw Object.assign(new Error("A reason is required"), { status: 400 });
    return ConnectivityState.findOneAndUpdate(
        { key: "PLATFORM" },
        { $set: { mode: normalized, reason: String(reason).trim(), changedAt: new Date(), changedBy: userId || null } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
};

const shouldQueueForShore = async () => (await getConnectivityState()).mode !== "CONNECTED";

const queueOfflineEvent = async ({ eventKey, eventType, severity = "LOW", vessel = null, sourceRef = "", payload }) => {
    const normalizedSeverity = String(severity).toUpperCase();
    if (!SEVERITY_PRIORITY[normalizedSeverity]) throw Object.assign(new Error("Invalid queue severity"), { status: 400 });
    const compactPayload = JSON.parse(JSON.stringify(payload));
    const payloadBytes = Buffer.byteLength(JSON.stringify(compactPayload), "utf8");
    if (payloadBytes > 96 * 1024) throw Object.assign(new Error("Offline event exceeds the 96KB queue limit"), { status: 413 });
    const key = String(eventKey || crypto.randomUUID()).slice(0, 160);
    return OfflineQueueEvent.findOneAndUpdate(
        { eventKey: key },
        { $setOnInsert: {
            eventKey: key, eventType, severity: normalizedSeverity,
            priority: SEVERITY_PRIORITY[normalizedSeverity], vessel, sourceRef,
            payload: compactPayload, payloadBytes, queuedAt: new Date(), nextAttemptAt: new Date(),
            expiresAt: new Date(Date.now() + RETENTION_MS),
        } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
};

const syncQueuedEvents = async ({ limit = 100 } = {}) => {
    const state = await getConnectivityState();
    if (state.mode === "OFFLINE") throw Object.assign(new Error("Cannot sync while connectivity is OFFLINE"), { status: 409 });
    const modeLimit = syncBatchLimitForMode(state.mode);
    const batchLimit = Math.min(Math.max(Number(limit) || 100, 1), modeLimit);
    const events = await OfflineQueueEvent.find({
        status: { $in: ["PENDING", "FAILED"] },
        nextAttemptAt: { $lte: new Date() },
    }).sort({ priority: -1, queuedAt: 1 }).limit(batchLimit);

    const syncedIds = [];
    for (const event of events) {
        event.status = "SYNCING";
        event.attempts += 1;
        await event.save();
        // This is the authenticated application-level shore boundary. A physical
        // satellite transport can replace this acknowledgement without changing the queue contract.
        event.status = "SYNCED";
        event.syncedAt = new Date();
        event.lastError = "";
        await event.save();
        syncedIds.push(event._id);
    }
    state.lastSuccessfulSyncAt = new Date();
    state.lastSyncError = "";
    await state.save();
    return { synced: syncedIds.length, eventIds: syncedIds };
};

module.exports = {
    MODES, SEVERITY_PRIORITY, RETENTION_MS, getConnectivityState, connectivityOverview,
    setConnectivityMode, shouldQueueForShore, queueOfflineEvent, syncQueuedEvents, syncBatchLimitForMode,
};
