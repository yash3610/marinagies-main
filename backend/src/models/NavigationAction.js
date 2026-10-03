const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema({
    latitude: { type: Number, min: -90, max: 90, required: true },
    longitude: { type: Number, min: -180, max: 180, required: true },
    speed: { type: Number, min: 0, max: 100, default: 0 },
    heading: { type: Number, min: 0, max: 360, default: 0 },
    timestamp: { type: Date, required: true },
}, { _id: false });

const navigationActionSchema = new mongoose.Schema({
    actionId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", default: null },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
    detectionEvent: { type: mongoose.Schema.Types.ObjectId, ref: "GhostTraceEvent", default: null },
    type: { type: String, enum: ["USE_TRUSTED_POSITION", "ENTER_SAFE_MODE"], required: true },
    status: {
        type: String,
        enum: ["PROPOSED", "SIMULATING", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "APPLIED", "FAILED"],
        default: "PROPOSED",
        index: true,
    },
    trustedPosition: { type: positionSchema, required: true },
    suspiciousPosition: { type: positionSchema, required: true },
    reason: { type: String, required: true, trim: true },
    digitalTwin: {
        result: { type: String, enum: ["NOT_RUN", "SAFE", "UNSAFE"], default: "NOT_RUN" },
        checks: { type: mongoose.Schema.Types.Mixed, default: {} },
        summary: { type: String, default: "" },
        simulatedAt: { type: Date, default: null },
    },
    decision: {
        decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        decidedAt: { type: Date, default: null },
        note: { type: String, trim: true, maxlength: 500, default: "" },
    },
    proposedAt: { type: Date, default: Date.now },
    appliedAt: { type: Date, default: null },
}, { timestamps: true });

navigationActionSchema.index({ vessel: 1, createdAt: -1 });

module.exports = mongoose.model("NavigationAction", navigationActionSchema);
