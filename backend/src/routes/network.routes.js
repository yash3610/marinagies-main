const express = require("express");
const { getNetworkOverview, ingestNetworkEvent, blockDomain, whitelistDomain, updateSegmentation, failoverSatellite, syncThreatFeed } = require("../controllers/network.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { telemetryIngestionAuth } = require("../middleware/telemetryIngestion.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.NETWORK_VIEW), getNetworkOverview);
router.post("/events/ingest", telemetryIngestionAuth, ingestNetworkEvent);
router.post("/domains/block", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("NETGUARD_DOMAIN_BLOCK", "NETWORK_POLICY"), blockDomain);
router.post("/domains/whitelist", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("NETGUARD_DOMAIN_WHITELIST", "NETWORK_POLICY"), whitelistDomain);
router.put("/policies/:vesselId/segmentation", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("NETGUARD_SEGMENTATION_UPDATE", "NETWORK_POLICY"), updateSegmentation);
router.post("/policies/:vesselId/failover", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("NETGUARD_SATELLITE_FAILOVER", "NETWORK_POLICY"), failoverSatellite);
router.post("/threat-feed/sync", authenticate, authorizePermission(PERMISSIONS.NETWORK_MANAGE), auditAction("NETGUARD_THREAT_FEED_SYNC", "THREAT_INDICATOR"), syncThreatFeed);

module.exports = router;
