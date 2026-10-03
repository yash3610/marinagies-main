const mongoose = require("mongoose");

const agentWatchEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true, trim: true, maxlength: 128 },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    sourceIp: { type: String, required: true, trim: true, maxlength: 64 },
    sourceDevice: { type: String, default: "unknown", trim: true, maxlength: 100 },
    userAccount: { type: String, default: "", trim: true, maxlength: 120 },
    eventKind: {
        type: String,
        enum: ["NETWORK_SCAN", "AUTH_FAILURE", "AUTH_SUCCESS", "PRIVILEGE_ESCALATION", "NETWORK_CONNECTION", "COMMAND_EXECUTION", "DATA_ACCESS", "EXFILTRATION"],
        required: true,
        index: true,
    },
    stage: { type: String, enum: ["RECON", "CREDENTIAL_ATTACK", "LATERAL_MOVEMENT", "EXFILTRATION"], required: true, index: true },
    target: { type: String, default: "", trim: true, maxlength: 200 },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    networkEvent: { type: mongoose.Schema.Types.ObjectId, ref: "NetworkEvent", default: null },
    simulated: { type: Boolean, default: false },
    timestamp: { type: Date, required: true, default: Date.now, immutable: true },
}, { timestamps: true });

agentWatchEventSchema.index({ vessel: 1, sourceIp: 1, timestamp: -1 });
agentWatchEventSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"], function (next) {
    next(new Error("AgentWatch events are append-only"));
});
module.exports = mongoose.model("AgentWatchEvent", agentWatchEventSchema);
