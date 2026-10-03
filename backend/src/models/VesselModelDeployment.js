const mongoose = require("mongoose");

const vesselModelDeploymentSchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true },
    modelKey: { type: String, required: true, uppercase: true, trim: true },
    currentVersion: { type: Number, default: null },
    previousVersion: { type: Number, default: null },
    targetVersion: { type: Number, default: null },
    status: { type: String, enum: ["PENDING", "APPLIED", "FAILED", "ROLLED_BACK"], default: "PENDING", index: true },
    queuedAt: { type: Date, default: Date.now },
    appliedAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null },
    error: { type: String, default: "", maxlength: 500 },
}, { timestamps: true });

vesselModelDeploymentSchema.index({ vessel: 1, modelKey: 1 }, { unique: true });
module.exports = mongoose.model("VesselModelDeployment", vesselModelDeploymentSchema);
