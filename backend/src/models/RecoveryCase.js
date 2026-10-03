const mongoose = require("mongoose");

const recoveryStepSchema = new mongoose.Schema({
    step: { type: String, required: true, trim: true },
    status: { type: String, enum: ["COMPLETED", "FAILED", "SKIPPED"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    occurredAt: { type: Date, default: Date.now },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: true });

const recoveryCaseSchema = new mongoose.Schema({
    caseId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    detection: { type: mongoose.Schema.Types.ObjectId, ref: "FileActivityEvent", default: null },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", default: null },
    status: { type: String, enum: ["DETECTED", "CONTAINED", "RESTORE_PENDING", "RESTORING", "RECOVERED", "FAILED"], default: "DETECTED", index: true },
    affectedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: "EdgeDevice" }],
    affectedDeviceIds: [{ type: String, trim: true }],
    fileSynchronizationEnabled: { type: Boolean, default: true },
    emergencyCommunicationActive: { type: Boolean, default: false },
    selectedSnapshot: { type: mongoose.Schema.Types.ObjectId, ref: "RecoverySnapshot", default: null },
    preview: { type: mongoose.Schema.Types.Mixed, default: null },
    integrity: { beforeRestore: { type: Boolean, default: false }, afterRestore: { type: Boolean, default: false }, expectedHash: { type: String, default: "" }, observedHash: { type: String, default: "" } },
    steps: [recoveryStepSchema],
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    recoveryDurationSeconds: { type: Number, min: 0, default: null },
    shoreSyncStatus: { type: String, enum: ["PENDING", "SYNCED"], default: "PENDING" },
    reportReady: { type: Boolean, default: false },
}, { timestamps: true });

recoveryCaseSchema.index({ vessel: 1, createdAt: -1 });
module.exports = mongoose.model("RecoveryCase", recoveryCaseSchema);
