const mongoose = require("mongoose");

const supplyChainScenarioSchema = new mongoose.Schema({
    scenarioId: { type: String, required: true, unique: true, trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    compromiseSeverity: { type: Number, min: 0, max: 100, required: true },
    affectedVessels: [{
        vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true },
        assetCount: { type: Number, min: 1, required: true },
        criticalityWeight: { type: Number, min: 1, required: true },
        projectedRisk: { type: Number, min: 0, max: 100, required: true },
        impactLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
    }],
    totalAssets: { type: Number, min: 0, required: true },
    blastRadius: { type: Number, min: 0, required: true },
    summary: { type: String, required: true },
    simulatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    simulatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("SupplyChainScenario", supplyChainScenarioSchema);
