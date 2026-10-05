const mongoose = require("mongoose");

const offlineQueueEventSchema = new mongoose.Schema({
    eventKey: { type: String, required: true, unique: true, trim: true, maxlength: 160 },
    eventType: {
        type: String,
        enum: ["TELEMETRY", "ALERT", "INCIDENT", "AUDIT", "THREAT_INTELLIGENCE", "SYSTEM"],
        required: true,
        index: true,
    },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW", index: true },
    priority: { type: Number, min: 1, max: 4, required: true, index: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", default: null, index: true },
    sourceRef: { type: String, trim: true, maxlength: 160, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    payloadBytes: { type: Number, min: 0, required: true },
    status: { type: String, enum: ["PENDING", "SYNCING", "SYNCED", "FAILED"], default: "PENDING", index: true },
    attempts: { type: Number, min: 0, default: 0 },
    queuedAt: { type: Date, default: Date.now, index: true },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    syncedAt: { type: Date, default: null },
    lastError: { type: String, maxlength: 500, default: "" },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

offlineQueueEventSchema.index({ status: 1, priority: -1, queuedAt: 1 });
offlineQueueEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OfflineQueueEvent", offlineQueueEventSchema);
