const mongoose = require("mongoose");

const fleetModelSchema = new mongoose.Schema({
    modelKey: { type: String, required: true, uppercase: true, trim: true },
    module: { type: String, required: true, uppercase: true, trim: true },
    version: { type: Number, required: true, min: 1 },
    previousVersion: { type: Number, default: null },
    status: { type: String, enum: ["CANDIDATE", "VALIDATED", "REJECTED", "ACTIVE", "RETIRED"], default: "CANDIDATE", index: true },
    learningType: { type: String, enum: ["RULE_PACK_AGGREGATION", "TRAINED_MODEL"], default: "RULE_PACK_AGGREGATION" },
    patternFingerprints: [{ type: String, trim: true }],
    patternCount: { type: Number, min: 0, default: 0 },
    artifactHash: { type: String, required: true, lowercase: true },
    validation: {
        precision: { type: Number, min: 0, max: 1, default: null },
        recall: { type: Number, min: 0, max: 1, default: null },
        f1: { type: Number, min: 0, max: 1, default: null },
        dataset: { type: String, default: "" },
        validatedAt: { type: Date, default: null },
        validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    activatedAt: { type: Date, default: null },
    notes: { type: String, default: "", maxlength: 1000 },
}, { timestamps: true });

fleetModelSchema.index({ modelKey: 1, version: 1 }, { unique: true });
module.exports = mongoose.model("FleetModel", fleetModelSchema);
