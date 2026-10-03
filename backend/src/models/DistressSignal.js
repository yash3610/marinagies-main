const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
    score: { type: Number, required: true, min: 0, max: 1 },
    weight: { type: Number, required: true, min: 0, max: 1 },
    reasons: [{ type: String, trim: true }],
}, { _id: false });

const distressSignalSchema = new mongoose.Schema({
    signalId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    receivingVessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    format: { type: String, enum: ["GMDSS", "DSC", "AIS_EPIRB"], required: true },
    mmsi: { type: String, required: true, match: /^\d{9}$/, trim: true },
    distressNature: { type: String, enum: ["SINKING", "FIRE", "COLLISION", "MAN_OVERBOARD", "MEDICAL", "DISABLED", "PIRACY", "OTHER"], default: "OTHER" },
    claimedLocation: {
        latitude: { type: Number, required: true, min: -90, max: 90 },
        longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    signal: {
        protocolValid: { type: Boolean, default: false },
        signalStrength: { type: Number, min: 0, max: 100, default: 0 },
        sourceChannel: { type: String, trim: true, default: "UNKNOWN" },
        corroboratingSources: [{ type: String, enum: ["COAST_GUARD", "EPIRB_SATELLITE", "NEARBY_VESSEL", "AIS_RELAY", "RADIO_RELAY"] }],
    },
    receivedAt: { type: Date, required: true, default: Date.now },
    simulated: { type: Boolean, default: false },
    offlineMode: { type: Boolean, default: true },
    contextSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    scores: {
        geographicPlausibility: { type: scoreSchema, required: true },
        technicalOrigin: { type: scoreSchema, required: true },
        weatherConsistency: { type: scoreSchema, required: true },
        historicalTrust: { type: scoreSchema, required: true },
        multiSourceCorroboration: { type: scoreSchema, required: true },
    },
    trustScore: { type: Number, required: true, min: 0, max: 1, index: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    decision: { type: String, enum: ["AUTO_ACCEPTED", "HUMAN_REVIEW", "LIKELY_FALSE"], required: true, index: true },
    status: { type: String, enum: ["ACCEPTED", "PENDING_REVIEW", "REJECTED"], required: true, index: true },
    explanation: { type: mongoose.Schema.Types.Mixed, required: true },
    navigationDispatch: {
        forwarded: { type: Boolean, default: false },
        forwardedAt: { type: Date, default: null },
        destination: { type: String, default: "AUTONOMOUS_NAVIGATION_BUS" },
    },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", default: null },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
    review: {
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        reviewedAt: { type: Date, default: null },
        decision: { type: String, enum: ["ACCEPT", "REJECT", null], default: null },
        note: { type: String, trim: true, maxlength: 500, default: "" },
    },
    processingTimeMs: { type: Number, min: 0, required: true },
}, { timestamps: true });

distressSignalSchema.index({ receivingVessel: 1, receivedAt: -1 });
distressSignalSchema.index({ mmsi: 1, receivedAt: -1 });
module.exports = mongoose.model("DistressSignal", distressSignalSchema);
