const express = require("express");
const { getDevices, registerDevice, quarantineDevice, releaseDevice, simulateDeviceFault } = require("../controllers/device.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.DEVICES_VIEW), getDevices);
router.post("/", authenticate, authorizePermission(PERMISSIONS.DEVICES_MANAGE), auditAction("EDGE_DEVICE_REGISTER", "EDGE_DEVICE"), registerDevice);
router.post("/:id/quarantine", authenticate, authorizePermission(PERMISSIONS.DEVICE_QUARANTINE), auditAction("EDGE_DEVICE_QUARANTINE", "EDGE_DEVICE"), quarantineDevice);
router.post("/:id/release", authenticate, authorizePermission(PERMISSIONS.DEVICE_QUARANTINE), auditAction("EDGE_DEVICE_RELEASE", "EDGE_DEVICE"), releaseDevice);
router.post("/:id/simulate-fault", authenticate, authorizePermission(PERMISSIONS.DEVICES_MANAGE), auditAction("EDGE_DEVICE_FAULT_INJECT", "EDGE_DEVICE"), simulateDeviceFault);

module.exports = router;
