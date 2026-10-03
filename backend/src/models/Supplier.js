const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    supplierId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, unique: true, trim: true, maxlength: 160 },
    category: { type: String, enum: ["HARDWARE", "SOFTWARE", "SATELLITE", "SERVICE", "OTHER"], required: true },
    status: { type: String, enum: ["ACTIVE", "MONITOR", "BLOCKED"], default: "ACTIVE" },
    baseRisk: { type: Number, min: 0, max: 100, default: 10 },
    riskScore: { type: Number, min: 0, max: 100, default: 0, index: true },
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW", index: true },
    blastRadius: { type: Number, min: 0, default: 0 },
    affectedVesselCount: { type: Number, min: 0, default: 0 },
    assetCount: { type: Number, min: 0, default: 0 },
    cves: [{
        cveId: { type: String, required: true, uppercase: true, trim: true },
        severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
        cvssScore: { type: Number, min: 0, max: 10, required: true },
        description: { type: String, default: "", trim: true, maxlength: 500 },
        publishedAt: { type: Date, default: null },
    }],
    explanation: {
        summary: { type: String, default: "Not evaluated" },
        factors: [{ type: String }],
        recommendation: { type: String, default: "Register supplier assets to calculate exposure." },
    },
    lastEvaluatedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema);
