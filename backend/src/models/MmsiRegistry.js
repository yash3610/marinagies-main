const mongoose = require("mongoose");

const mmsiRegistrySchema = new mongoose.Schema({
    mmsi: { type: String, required: true, unique: true, match: /^\d{9}$/, trim: true },
    vesselName: { type: String, required: true, trim: true, maxlength: 150 },
    active: { type: Boolean, default: true },
    falseAlarmCount: { type: Number, min: 0, default: 0 },
    confirmedHoaxCount: { type: Number, min: 0, default: 0 },
    lastKnownLocation: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
        observedAt: { type: Date, default: null },
    },
    source: { type: String, enum: ["LOCAL", "FLEET_INTELLIGENCE", "MANUAL", "DEMO"], default: "LOCAL" },
    lastSyncedAt: { type: Date, default: Date.now },
}, { timestamps: true });

mmsiRegistrySchema.index({ confirmedHoaxCount: -1, falseAlarmCount: -1 });
module.exports = mongoose.model("MmsiRegistry", mmsiRegistrySchema);
