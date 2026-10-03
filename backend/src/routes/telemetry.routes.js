const express = require("express");

const {
    getLatestTelemetry,
    getVesselTelemetry,
    getTelemetryHistory,
    createTelemetry,
} = require("../controllers/telemetry.controller");

const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const { telemetryIngestionAuth } = require("../middleware/telemetryIngestion.middleware");

const router = express.Router();

// Latest telemetry of all vessels
router.get("/", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_VIEW), getLatestTelemetry);

// Telemetry of specific vessel
router.get("/vessel/:vesselId/history", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_VIEW), getTelemetryHistory);
router.get("/vessel/:vesselId/latest", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_VIEW), getVesselTelemetry);
router.get("/vessel/:vesselId", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_VIEW), getVesselTelemetry);

// Create telemetry
router.post("/ingest", telemetryIngestionAuth, createTelemetry);
router.post("/", telemetryIngestionAuth, createTelemetry);

module.exports = router;
