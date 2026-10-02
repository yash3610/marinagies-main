const express = require("express");

const {
    getAlerts,
    getAlertById,
    createAlert,
    updateAlert,
} = require("../controllers/alert.controller");

const {
    authenticate,
    authorizePermission,
} = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const { auditAction } = require("../middleware/audit.middleware");

const router = express.Router();

// Get all alerts
router.get("/", authenticate, authorizePermission(PERMISSIONS.ALERTS_VIEW), getAlerts);

// Get single alert
router.get("/:id", authenticate, authorizePermission(PERMISSIONS.ALERTS_VIEW), getAlertById);

// Create alert
router.post(
    "/",
    authenticate,
    authorizePermission(PERMISSIONS.ALERTS_MANAGE),
    auditAction("ALERT_CREATE", "ALERT"),
    createAlert
);

// Update alert
router.put(
    "/:id",
    authenticate,
    authorizePermission(PERMISSIONS.ALERTS_MANAGE),
    auditAction("ALERT_UPDATE", "ALERT"),
    updateAlert
);

module.exports = router;
