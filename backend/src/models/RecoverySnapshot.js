const mongoose = require("mongoose");

const recoverySnapshotSchema = new mongoose.Schema({
    snapshotId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    kind: { type: String, enum: ["INCREMENTAL", "FULL"], required: true, index: true },
    objectKey: { type: String, required: true, unique: true, trim: true },
    encryptedPayload: { type: String, required: true, select: false },
    iv: { type: String, required: true, select: false },
    authTag: { type: String, required: true, select: false },
    encryption: { algorithm: { type: String, default: "AES-256-GCM" }, keyId: { type: String, required: true } },
    sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    manifest: {
        itemCount: { type: Number, min: 0, default: 0 },
        changedItemCount: { type: Number, min: 0, default: 0 },
        estimatedBytes: { type: Number, min: 0, default: 0 },
        includedScopes: [{ type: String, trim: true }],
    },
    locked: { type: Boolean, default: true, immutable: true },
    lockedUntil: { type: Date, required: true, immutable: true },
    createdAt: { type: Date, required: true, default: Date.now, immutable: true },
    expiresAt: { type: Date, required: true, index: true, immutable: true },
    source: { type: String, enum: ["SCHEDULER", "MANUAL", "DEMO"], default: "MANUAL" },
}, { versionKey: false });

recoverySnapshotSchema.index({ vessel: 1, createdAt: -1 });
recoverySnapshotSchema.pre("save", function preventLockedMutation(next) {
    if (!this.isNew && this.locked) return next(new Error("WORM-locked snapshots cannot be modified"));
    next();
});
for (const hook of ["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"]) {
    recoverySnapshotSchema.pre(hook, function rejectSnapshotMutation(next) { next(new Error("WORM-locked snapshots cannot be modified or deleted")); });
}
module.exports = mongoose.model("RecoverySnapshot", recoverySnapshotSchema);
