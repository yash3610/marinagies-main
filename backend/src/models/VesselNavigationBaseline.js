const mongoose = require("mongoose");

const metricSchema = new mongoose.Schema({
    mean: { type: Number, default: 0 },
    standardDeviation: { type: Number, default: 0 },
    p95: { type: Number, default: 0 },
}, { _id: false });

const vesselNavigationBaselineSchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, unique: true },
    windowDays: { type: Number, default: 90, immutable: true },
    windowStartedAt: { type: Date, required: true },
    sampleCount: { type: Number, min: 0, default: 0 },
    minimumSamplesMet: { type: Boolean, default: false },
    aisGapMeters: { type: metricSchema, default: () => ({}) },
    deadReckoningGapMeters: { type: metricSchema, default: () => ({}) },
    speedKnots: { type: metricSchema, default: () => ({}) },
    refreshedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("VesselNavigationBaseline", vesselNavigationBaselineSchema);
