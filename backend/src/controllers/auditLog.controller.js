const AuditLog = require("../models/AuditLog");

// ========================================
// GET AUDIT LOGS
// ========================================

const getAuditLogs = async (req, res) => {
    try {
        const {
            action,
            resource,
            status,
            limit = 100,
        } = req.query;

        const filter = {};

        if (action) {
            filter.action = action;
        }

        if (resource) {
            filter.resource = resource;
        }

        if (status) {
            filter.status = status;
        }

        const logs = await AuditLog.find(filter)
            .populate(
                "user",
                "name email role"
            )
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json({
            success: true,
            count: logs.length,
            logs,
        });
    } catch (error) {
        console.error(
            "Get audit logs error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs",
        });
    }
};

// ========================================
// GET SINGLE LOG
// ========================================

const getAuditLogById = async (
    req,
    res
) => {
    try {
        const log =
            await AuditLog.findById(req.params.id)
                .populate(
                    "user",
                    "name email role"
                );

        if (!log) {
            return res.status(404).json({
                success: false,
                message: "Audit log not found",
            });
        }

        res.json({
            success: true,
            log,
        });
    } catch (error) {
        console.error(
            "Get audit log error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch audit log",
        });
    }
};

// ========================================
// CREATE AUDIT LOG
// ========================================

const createAuditLog = async (
    req,
    res
) => {
    try {
        const {
            action,
            resource,
            resourceId,
            description,
            status,
            metadata,
        } = req.body;

        if (!action || !resource) {
            return res.status(400).json({
                success: false,
                message:
                    "Action and resource are required",
            });
        }

        const auditLog =
            await AuditLog.create({
                user: req.user?.userId || null,
                action,
                resource,
                resourceId,
                description,
                status: status || "SUCCESS",
                metadata: metadata || {},
                ipAddress:
                    req.headers["x-forwarded-for"] ||
                    req.socket.remoteAddress ||
                    "",
                userAgent:
                    req.headers["user-agent"] || "",
            });

        const populatedLog =
            await AuditLog.findById(
                auditLog._id
            ).populate(
                "user",
                "name email role"
            );

        res.status(201).json({
            success: true,
            message:
                "Audit log created successfully",
            log: populatedLog,
        });
    } catch (error) {
        console.error(
            "Create audit log error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to create audit log",
        });
    }
};

module.exports = {
    getAuditLogs,
    getAuditLogById,
    createAuditLog,
};