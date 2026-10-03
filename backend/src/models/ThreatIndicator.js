const mongoose = require("mongoose");

const threatIndicatorSchema = new mongoose.Schema({
    indicatorType: { type: String, enum: ["DOMAIN", "IP"], required: true },
    value: { type: String, required: true, lowercase: true, trim: true },
    verdict: { type: String, enum: ["MALICIOUS", "SUSPICIOUS", "TRUSTED"], required: true },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    source: { type: String, enum: ["LOCAL_POLICY", "NETGUARD_HEURISTIC", "SHORE_FEED", "OPERATOR"], default: "LOCAL_POLICY" },
    active: { type: Boolean, default: true, index: true },
    fleetWide: { type: Boolean, default: true },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

threatIndicatorSchema.index({ indicatorType: 1, value: 1 }, { unique: true });
module.exports = mongoose.model("ThreatIndicator", threatIndicatorSchema);
