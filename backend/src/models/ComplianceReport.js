const mongoose = require("mongoose");

const complianceReportSchema = new mongoose.Schema({
    reportId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["ASSET_INVENTORY", "INCIDENT_RESPONSE", "COMMAND_HISTORY", "NETWORK_ACTIVITY", "RECOVERY_ACTION", "FLEET_RISK", "USER_ACCESS_RBAC"], required: true, index: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", default: null, index: true },
    dateRange: { from: { type: Date, required: true }, to: { type: Date, required: true } },
    framework: { type: String, default: "IACS_UR_E26" },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    summary: { recordCount: { type: Number, min: 0, default: 0 }, headline: { type: String, default: "" } },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    contentHash: { type: String, required: true, lowercase: true },
    locked: { type: Boolean, default: true, immutable: true },
    storageMode: { type: String, enum: ["MONGODB_APPLICATION_WORM", "MINIO_OBJECT_LOCK"], default: "MONGODB_APPLICATION_WORM" },
}, { timestamps: true });

const immutableOperation = function (next) { next(new Error("Compliance reports are immutable")); };
complianceReportSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"], immutableOperation);
complianceReportSchema.pre("save", function (next) {
    if (!this.isNew) return next(new Error("Compliance reports are immutable"));
    next();
});
complianceReportSchema.index({ createdAt: -1, type: 1 });
module.exports = mongoose.model("ComplianceReport", complianceReportSchema);
