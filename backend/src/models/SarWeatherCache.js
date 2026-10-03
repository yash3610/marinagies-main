const mongoose = require("mongoose");

const sarWeatherCacheSchema = new mongoose.Schema({
    zoneId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    center: {
        latitude: { type: Number, required: true, min: -90, max: 90 },
        longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    radiusKm: { type: Number, min: 1, max: 1000, default: 150 },
    condition: { type: String, enum: ["CALM", "MODERATE", "ROUGH", "STORM", "UNKNOWN"], default: "UNKNOWN" },
    windSpeedKnots: { type: Number, min: 0, max: 250, default: 0 },
    waveHeightMeters: { type: Number, min: 0, max: 40, default: 0 },
    confirmedFalseAlarms: { type: Number, min: 0, default: 0 },
    observedAt: { type: Date, required: true, default: Date.now },
    source: { type: String, default: "LOCAL_CACHE", trim: true },
}, { timestamps: true });

sarWeatherCacheSchema.index({ observedAt: -1 });
module.exports = mongoose.model("SarWeatherCache", sarWeatherCacheSchema);
