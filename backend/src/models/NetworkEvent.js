const mongoose = require("mongoose");

const networkEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true, trim: true, maxlength: 128 },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    eventType: { type: String, enum: ["DNS_QUERY", "NETWORK_CONNECTION", "SATELLITE_LINK_CHANGE"], required: true },
    sourceDevice: { type: String, required: true, trim: true, maxlength: 100 },
    sourceIp: { type: String, default: "", trim: true, maxlength: 64 },
    sourceSegment: { type: String, enum: ["OT", "IT", "CREW", "MARINEAEGIS", "UPLINK"], required: true },
    destinationSegment: { type: String, enum: ["OT", "IT", "CREW", "MARINEAEGIS", "UPLINK", null], default: null },
    domain: { type: String, default: null, lowercase: true, trim: true, maxlength: 253 },
    destinationIp: { type: String, default: "", trim: true, maxlength: 64 },
    destinationPort: { type: Number, min: 0, max: 65535, default: null },
    protocol: { type: String, enum: ["DNS", "TCP", "UDP", "ICMP", "SYSTEM"], default: "DNS" },
    satelliteProvider: { type: String, default: "", trim: true },
    verdict: { type: String, enum: ["ALLOWED", "BLOCKED", "SINKHOLED"], required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    sinkholeIp: { type: String, default: null },
    threatIndicator: { type: mongoose.Schema.Types.ObjectId, ref: "ThreatIndicator", default: null },
    simulated: { type: Boolean, default: false },
    timestamp: { type: Date, required: true, default: Date.now, immutable: true },
}, { timestamps: true });

networkEventSchema.index({ vessel: 1, timestamp: -1 });
networkEventSchema.index({ domain: 1, timestamp: -1 });
networkEventSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"], function (next) {
    next(new Error("Network security events are append-only"));
});
module.exports = mongoose.model("NetworkEvent", networkEventSchema);
