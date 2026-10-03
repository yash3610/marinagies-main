const mongoose = require("mongoose");

const fileActivityEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true, trim: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    device: { type: mongoose.Schema.Types.ObjectId, ref: "EdgeDevice", default: null },
    deviceId: { type: String, required: true, trim: true, maxlength: 100 },
    modificationsPerMinute: { type: Number, required: true, min: 0, max: 1000000 },
    directoriesAffected: { type: Number, required: true, min: 0, max: 100000 },
    extensionsObserved: [{ type: String, lowercase: true, trim: true, maxlength: 30 }],
    cpuPercent: { type: Number, min: 0, max: 100, default: 0 },
    ioPercent: { type: Number, min: 0, max: 100, default: 0 },
    filesSample: [{ type: String, trim: true, maxlength: 300 }],
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    simulated: { type: Boolean, default: false },
    signals: { type: mongoose.Schema.Types.Mixed, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    classification: { type: String, enum: ["NORMAL", "SUSPICIOUS", "RANSOMWARE_CONFIRMED"], required: true, index: true },
    explanation: { type: mongoose.Schema.Types.Mixed, required: true },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", default: null },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
    recoveryCase: { type: mongoose.Schema.Types.ObjectId, ref: "RecoveryCase", default: null },
}, { timestamps: true });

fileActivityEventSchema.index({ vessel: 1, timestamp: -1 });
module.exports = mongoose.model("FileActivityEvent", fileActivityEventSchema);
