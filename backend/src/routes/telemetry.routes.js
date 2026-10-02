const express = require("express");

const {
    getLatestTelemetry,
    getVesselTelemetry,
    createTelemetry,
} = require("../controllers/telemetry.controller");

const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();

// Latest telemetry of all vessels
router.get("/", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_VIEW), getLatestTelemetry);

// Telemetry of specific vessel
router.get("/vessel/:vesselId", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_VIEW), getVesselTelemetry);

// Create telemetry
router.post("/", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_INGEST), createTelemetry);

module.exports = router;