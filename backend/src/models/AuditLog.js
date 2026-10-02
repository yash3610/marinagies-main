const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        actorRole: {
            type: String,
            default: null,
            trim: true,
        },

        vessel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vessel",
            default: null,
        },

        action: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            maxlength: 100,
        },

        resource: {
            type: String,
            required: true,
            trim: true,
        },

        resourceId: {
            type: String,
            default: null,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        ipAddress: {
            type: String,
            default: "",
        },

        userAgent: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["SUCCESS", "FAILED"],
            default: "SUCCESS",
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        requestId: {
            type: String,
            default: null,
            trim: true,
        },

        sequenceNumber: {
            type: Number,
            required: true,
            unique: true,
            sparse: true,
            min: 1,
        },

        previousHash: {
            type: String,
            required: true,
            default: "GENESIS",
        },

        entryHash: {
            type: String,
            required: true,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ vessel: 1, createdAt: -1 });

const immutableOperation = function (next) {
    next(new Error("Audit log entries are immutable"));
};

auditLogSchema.pre(
    ["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"],
    immutableOperation
);

auditLogSchema.pre("save", function (next) {
    if (!this.isNew) return next(new Error("Audit log entries are immutable"));
    next();
});

const AuditLog = mongoose.model(
    "AuditLog",
    auditLogSchema
);

module.exports = AuditLog;
