const express = require("express");

const {
    getLatestTelemetry,
    getVesselTelemetry,
    createTelemetry,
} = require("../controllers/telemetry.controller");

const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Latest telemetry of all vessels
router.get("/", authenticate, getLatestTelemetry);

// Telemetry of specific vessel
router.get("/vessel/:vesselId", authenticate, getVesselTelemetry);

// Create telemetry
router.post("/", authenticate, createTelemetry);

module.exports = router;