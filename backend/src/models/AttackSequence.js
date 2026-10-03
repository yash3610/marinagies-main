const mongoose = require("mongoose");

const attackSequenceSchema = new mongoose.Schema({
    sequenceId: { type: String, required: true, unique: true, trim: true },
    fingerprint: { type: String, required: true, unique: true, trim: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    sourceIp: { type: String, required: true, trim: true, index: true },
    sourceDevice: { type: String, default: "unknown", trim: true },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "AgentWatchEvent" }],
    stages: [{ type: String, enum: ["RECON", "CREDENTIAL_ATTACK", "LATERAL_MOVEMENT", "EXFILTRATION"] }],
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    durationMs: { type: Number, min: 0, required: true },
    medianIntervalMs: { type: Number, min: 0, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    confidenceLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    classification: { type: String, enum: ["INCOMPLETE", "HUMAN_PACED", "AUTONOMOUS_SUSPECTED"], required: true },
    mitreTechniques: [{ techniqueId: String, name: String, stage: String }],
    explanation: {
        whatHappened: { type: String, required: true },
        whyItMatters: { type: String, required: true },
        whatCausedIt: { type: String, required: true },
        recommendedAction: { type: String, required: true },
    },
    isolated: { type: Boolean, default: false },
    isolatedAt: { type: Date, default: null },
    reviewStatus: { type: String, enum: ["PENDING", "CONFIRMED", "FALSE_POSITIVE"], default: "PENDING", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", trim: true, maxlength: 500 },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", default: null },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
}, { timestamps: true });

attackSequenceSchema.index({ vessel: 1, createdAt: -1 });
module.exports = mongoose.model("AttackSequence", attackSequenceSchema);
