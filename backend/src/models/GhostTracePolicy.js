const mongoose = require("mongoose");

const ghostTracePolicySchema = new mongoose.Schema({
    key: { type: String, unique: true, default: "DEFAULT" },
    classThresholds: {
        CONTAINER: { type: Number, min: 0.5, max: 0.95, default: 0.70 },
        TANKER: { type: Number, min: 0.5, max: 0.95, default: 0.65 },
        CARGO: { type: Number, min: 0.5, max: 0.95, default: 0.72 },
        BULK_CARRIER: { type: Number, min: 0.5, max: 0.95, default: 0.72 },
        PASSENGER: { type: Number, min: 0.5, max: 0.95, default: 0.65 },
        OTHER: { type: Number, min: 0.5, max: 0.95, default: 0.75 },
    },
    slowDrift: {
        windowHours: { type: Number, min: 1, max: 24, default: 6 },
        minimumSamples: { type: Number, min: 4, max: 100, default: 6 },
        minimumDurationMinutes: { type: Number, min: 10, max: 360, default: 30 },
        minimumNetDriftMeters: { type: Number, min: 50, max: 5000, default: 150 },
        minimumSlopeMetersPerHour: { type: Number, min: 5, max: 1000, default: 30 },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("GhostTracePolicy", ghostTracePolicySchema);
