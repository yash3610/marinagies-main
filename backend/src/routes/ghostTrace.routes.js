const express = require("express");
const { getEvents, getEventById, getConfiguration, updateConfiguration } = require("../controllers/ghostTrace.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const { auditAction } = require("../middleware/audit.middleware");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_VIEW), getEvents);
router.get("/config", authenticate, authorizePermission(PERMISSIONS.TELEMETRY_VIEW), getConfiguration);
router.put("/config", authenticate, authorizePermission(PERMISSIONS.VESSELS_MANAGE), auditAction("GHOSTTRACE_POLICY_UPDATE", "GHOSTTRACE_POLICY"), updateConfiguration);
router.get("/:id", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_VIEW), getEventById);

module.exports = router;
