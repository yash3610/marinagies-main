const mongoose = require("mongoose");

const supplyChainAssetSchema = new mongoose.Schema({
    assetId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    edgeDevice: { type: mongoose.Schema.Types.ObjectId, ref: "EdgeDevice", default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, enum: ["NAVIGATION", "SENSOR", "NETWORK", "ENGINE", "SATELLITE", "SOFTWARE", "OTHER"], required: true },
    deviceModel: { type: String, required: true, trim: true, maxlength: 120 },
    firmwareVersion: { type: String, required: true, trim: true, maxlength: 80 },
    criticality: { type: String, enum: ["STANDARD", "OPERATIONAL", "SAFETY_CRITICAL"], default: "OPERATIONAL", index: true },
    operationalStatus: { type: String, enum: ["ACTIVE", "DEGRADED", "OFFLINE", "RETIRED"], default: "ACTIVE" },
    knownCves: [{ type: String, uppercase: true, trim: true }],
    lastInventorySyncAt: { type: Date, default: Date.now },
}, { timestamps: true });

supplyChainAssetSchema.index({ vessel: 1, supplier: 1 });
supplyChainAssetSchema.index({ supplier: 1, criticality: 1 });
module.exports = mongoose.model("SupplyChainAsset", supplyChainAssetSchema);
