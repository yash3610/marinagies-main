const express = require("express");

const {
    getAlerts,
    getAlertById,
    createAlert,
    updateAlert,
} = require("../controllers/alert.controller");

const {
    authenticate,
    authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get all alerts
router.get("/", authenticate, getAlerts);

// Get single alert
router.get("/:id", authenticate, getAlertById);

// Create alert
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SHORE_SECURITY_ANALYST"),
    createAlert
);

// Update alert
router.put(
    "/:id",
    authenticate,
    authorize("ADMIN", "SHORE_SECURITY_ANALYST"),
    updateAlert
);

module.exports = router;