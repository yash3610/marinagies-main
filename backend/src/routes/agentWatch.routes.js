const express = require("express");
const { getAgentWatchOverview, ingestEvent, simulateAttack, reviewSequence, releaseSource } = require("../controllers/agentWatch.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { telemetryIngestionAuth } = require("../middleware/telemetryIngestion.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.SECURITY_OPERATIONS_VIEW), getAgentWatchOverview);
router.post("/events/ingest", telemetryIngestionAuth, ingestEvent);
router.post("/simulate", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("AGENTWATCH_ATTACK_SIMULATE", "ATTACK_SEQUENCE"), simulateAttack);
router.post("/sequences/:id/review", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("AGENTWATCH_SEQUENCE_REVIEW", "ATTACK_SEQUENCE"), reviewSequence);
router.post("/sequences/:id/release", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("AGENTWATCH_SOURCE_RELEASE", "ATTACK_SEQUENCE"), releaseSource);

module.exports = router;
