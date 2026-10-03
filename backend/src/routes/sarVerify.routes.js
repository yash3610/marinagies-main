const express = require("express");
const { getOverview, ingestSignal, reviewSignal, upsertRegistry, upsertWeather, simulateSignal, bootstrapDemo } = require("../controllers/sarVerify.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { telemetryIngestionAuth } = require("../middleware/telemetryIngestion.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.SAR_VERIFY_VIEW), getOverview);
router.post("/signals/ingest", telemetryIngestionAuth, auditAction("DISTRESS_SIGNAL_INGEST", "DISTRESS_SIGNAL"), ingestSignal);
router.post("/signals/:id/review", authenticate, authorizePermission(PERMISSIONS.SAR_VERIFY_MANAGE), auditAction("DISTRESS_SIGNAL_REVIEW", "DISTRESS_SIGNAL"), reviewSignal);
router.put("/registry", authenticate, authorizePermission(PERMISSIONS.SAR_VERIFY_MANAGE), auditAction("MMSI_REGISTRY_UPDATE", "MMSI_REGISTRY"), upsertRegistry);
router.put("/weather", authenticate, authorizePermission(PERMISSIONS.SAR_VERIFY_MANAGE), auditAction("SAR_WEATHER_CACHE_UPDATE", "SAR_WEATHER_CACHE"), upsertWeather);
router.post("/simulate", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_MANAGE), auditAction("DISTRESS_SIGNAL_SIMULATE", "DISTRESS_SIGNAL"), simulateSignal);
router.post("/bootstrap-demo", authenticate, authorizePermission(PERMISSIONS.SAR_VERIFY_MANAGE), auditAction("SARVERIFY_DEMO_BOOTSTRAP", "SAR_CONTEXT"), bootstrapDemo);

module.exports = router;
