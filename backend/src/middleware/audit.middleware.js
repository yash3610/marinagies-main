const crypto = require("node:crypto");
const mongoose = require("mongoose");
const { writeAuditLog } = require("../services/audit.service");

const SENSITIVE_KEYS = new Set([
    "password",
    "confirmpassword",
    "token",
    "accesstoken",
    "refreshtoken",
    "secret",
    "mfacode",
]);

const sanitize = (value) => {
    if (Array.isArray(value)) return value.map(sanitize);
    if (!value || typeof value !== "object") return value;
    return Object.entries(value).reduce((result, [key, item]) => {
        result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : sanitize(item);
        return result;
    }, {});
};

const auditAction = (action, resource, resourceIdParam = "id") =>
    (req, res, next) => {
        const requestId = req.headers["x-request-id"] || crypto.randomUUID();
        res.setHeader("X-Request-Id", requestId);

        res.once("finish", () => {
            if (mongoose.connection.readyState !== 1) return;
            const requestedVessel = res.locals.auditVesselId || req.body?.vessel || req.params?.vesselId;
            const auditUser = res.locals.auditUser || req.user;
            writeAuditLog({
                user: auditUser?.userId || null,
                actorRole: auditUser?.role || null,
                vessel: mongoose.isValidObjectId(requestedVessel) ? requestedVessel : null,
                action,
                resource,
                resourceId: res.locals.auditResourceId || req.params?.[resourceIdParam] || null,
                description: `${req.method} ${req.originalUrl}`,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
                userAgent: req.headers["user-agent"] || "",
                status: res.statusCode >= 200 && res.statusCode < 400 ? "SUCCESS" : "FAILED",
                requestId,
                metadata: {
                    method: req.method,
                    path: req.originalUrl,
                    statusCode: res.statusCode,
                    body: sanitize(req.body || {}),
                },
            }).catch((error) => {
                console.error("Automatic audit log error:", error.message);
            });
        });

        next();
    };

module.exports = { auditAction, sanitize };
