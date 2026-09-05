const express = require("express");

const {
    getAuditLogs,
    getAuditLogById,
    createAuditLog,
} = require("../controllers/auditLog.controller");

const {
    authenticate,
    authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// ADMIN + SECURITY ANALYST can view logs
router.get(
    "/",
    authorize(
        "ADMIN",
        "SHORE_SECURITY_ANALYST"
    ),
    getAuditLogs
);

router.get(
    "/:id",
    authorize(
        "ADMIN",
        "SHORE_SECURITY_ANALYST"
    ),
    getAuditLogById
);

// Creating logs is internal/security action
router.post(
    "/",
    authorize(
        "ADMIN",
        "SHORE_SECURITY_ANALYST"
    ),
    createAuditLog
);

module.exports = router;