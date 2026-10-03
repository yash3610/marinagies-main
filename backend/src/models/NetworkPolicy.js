const mongoose = require("mongoose");

const segmentRuleSchema = new mongoose.Schema({
    from: { type: String, enum: ["OT", "IT", "CREW", "MARINEAEGIS", "UPLINK"], required: true },
    to: { type: String, enum: ["OT", "IT", "CREW", "MARINEAEGIS", "UPLINK"], required: true },
    action: { type: String, enum: ["ALLOW", "BLOCK"], required: true },
    reason: { type: String, default: "", trim: true, maxlength: 300 },
}, { _id: false });

const networkPolicySchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, unique: true },
    policyVersion: { type: Number, min: 1, default: 1 },
    dns: {
        enabled: { type: Boolean, default: true },
        sinkholeIp: { type: String, default: "10.255.255.1", trim: true },
        localBlocklist: [{ type: String, lowercase: true, trim: true }],
        whitelist: [{ type: String, lowercase: true, trim: true }],
        hourlyAlertThreshold: { type: Number, min: 1, max: 10000, default: 10 },
    },
    segmentationRules: { type: [segmentRuleSchema], default: () => [
        { from: "MARINEAEGIS", to: "OT", action: "ALLOW", reason: "Security monitoring" },
        { from: "OT", to: "MARINEAEGIS", action: "ALLOW", reason: "Security telemetry" },
        { from: "IT", to: "UPLINK", action: "ALLOW", reason: "Business connectivity" },
        { from: "CREW", to: "UPLINK", action: "ALLOW", reason: "Crew internet" },
        { from: "OT", to: "UPLINK", action: "BLOCK", reason: "OT cannot directly reach public uplink" },
        { from: "CREW", to: "OT", action: "BLOCK", reason: "Crew network isolated from operational technology" },
        { from: "IT", to: "OT", action: "BLOCK", reason: "Business IT isolated from operational technology" },
    ] },
    isolatedSources: [{
        sourceIp: { type: String, required: true, trim: true },
        reason: { type: String, required: true, trim: true },
        sequence: { type: mongoose.Schema.Types.ObjectId, ref: "AttackSequence", default: null },
        isolatedAt: { type: Date, default: Date.now },
        releasedAt: { type: Date, default: null },
        releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        active: { type: Boolean, default: true },
    }],
    satellite: {
        primaryProvider: { type: String, default: "SATCOM_PRIMARY", trim: true },
        backupProvider: { type: String, default: "SATCOM_BACKUP", trim: true },
        activeProvider: { type: String, default: "SATCOM_PRIMARY", trim: true },
        primaryHealthy: { type: Boolean, default: true },
        lastSwitchedAt: { type: Date, default: null },
    },
    lastShoreSyncAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("NetworkPolicy", networkPolicySchema);
