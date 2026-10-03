const mongoose = require("mongoose");

const distributionSchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true },
    status: { type: String, enum: ["PENDING", "APPLIED", "FAILED"], default: "PENDING" },
    appliedAt: { type: Date, default: null },
    error: { type: String, default: "", maxlength: 300 },
}, { _id: false });

const unifiedThreatIndicatorSchema = new mongoose.Schema({
    indicatorId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    fingerprint: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: {
        type: String,
        enum: ["DOMAIN", "IP", "GPS_SPOOFING", "ATTACK_PATTERN", "COMMAND_SIGNATURE", "DEVICE_COMPROMISE", "RANSOMWARE_SIGNATURE", "FALSE_DISTRESS"],
        required: true,
        index: true,
    },
    value: { type: String, required: true, trim: true, maxlength: 1000 },
    sourceModule: { type: String, enum: ["NETGUARD", "GHOSTTRACE", "AGENTWATCH", "ROCSHIELD", "EDGEARMOR", "RECOVERYSHIELD", "SARVERIFY", "OPERATOR"], required: true },
    sourceRef: { model: { type: String, default: "" }, id: { type: String, default: "" } },
    discoveryVessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", default: null, index: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
    confidence: { type: Number, min: 0, max: 100, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    extractedVector: { type: mongoose.Schema.Types.Mixed, default: {} },
    rawDataIncluded: { type: Boolean, default: false, immutable: true },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "FALSE_POSITIVE"], default: "ACTIVE", index: true },
    fleetWide: { type: Boolean, default: true },
    occurrences: { type: Number, min: 1, default: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    shoreSyncStatus: { type: String, enum: ["QUEUED", "SYNCED"], default: "SYNCED" },
    distributions: { type: [distributionSchema], default: [] },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

unifiedThreatIndicatorSchema.index({ status: 1, severity: 1, lastSeenAt: -1 });
unifiedThreatIndicatorSchema.index({ "distributions.vessel": 1, "distributions.status": 1 });
module.exports = mongoose.model("UnifiedThreatIndicator", unifiedThreatIndicatorSchema);
