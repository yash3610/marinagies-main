const express = require("express");
const { getOverview, getQueue, updateMode, syncQueue } = require("../controllers/connectivity.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.CONNECTIVITY_VIEW), getOverview);
router.get("/queue", authenticate, authorizePermission(PERMISSIONS.CONNECTIVITY_VIEW), getQueue);
router.patch("/mode", authenticate, authorizePermission(PERMISSIONS.CONNECTIVITY_MANAGE), auditAction("CONNECTIVITY_MODE_CHANGE", "CONNECTIVITY"), updateMode);
router.post("/sync", authenticate, authorizePermission(PERMISSIONS.CONNECTIVITY_MANAGE), auditAction("OFFLINE_QUEUE_SYNC", "OFFLINE_QUEUE"), syncQueue);
module.exports = router;
