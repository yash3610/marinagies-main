const express = require("express");

const {
    getAuditLogs,
    getAuditLogById,
    verifyAuditChain,
} = require("../controllers/auditLog.controller");

const {
    authenticate,
    authorizePermission,
} = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();

router.use(authenticate);

// ADMIN + SECURITY ANALYST can view logs
router.get(
    "/",
    authorizePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
    getAuditLogs
);

router.get(
    "/verify-chain",
    authorizePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
    verifyAuditChain
);

router.get(
    "/:id",
    authorizePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
    getAuditLogById
);

module.exports = router;
