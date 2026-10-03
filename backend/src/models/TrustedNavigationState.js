const mongoose = require("mongoose");

const trustedNavigationStateSchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, unique: true },
    telemetry: { type: mongoose.Schema.Types.ObjectId, ref: "Telemetry", default: null },
    latitude: { type: Number, min: -90, max: 90, required: true },
    longitude: { type: Number, min: -180, max: 180, required: true },
    speed: { type: Number, min: 0, max: 100, default: 0 },
    heading: { type: Number, min: 0, max: 360, default: 0 },
    source: { type: String, enum: ["MULTI_SENSOR", "MANUAL", "DIGITAL_TWIN"], default: "MULTI_SENSOR" },
    trustScore: { type: Number, min: 0, max: 1, default: 1 },
    reason: { type: String, required: true, trim: true },
    trustedAt: { type: Date, required: true },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    locked: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("TrustedNavigationState", trustedNavigationStateSchema);
