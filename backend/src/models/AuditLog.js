const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        action: {
            type: String,
            required: true,
            enum: [
                "LOGIN",
                "LOGOUT",
                "CREATE",
                "UPDATE",
                "DELETE",
                "VIEW",
                "EXPORT",
                "SIMULATION_START",
                "SIMULATION_STOP",
                "ALERT_ACKNOWLEDGE",
                "INCIDENT_UPDATE",
                "DEVICE_UPDATE",
                "SYSTEM_ACTION",
            ],
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
    },
    {
        timestamps: true,
    }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });

const AuditLog = mongoose.model(
    "AuditLog",
    auditLogSchema
);

module.exports = AuditLog;