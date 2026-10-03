const express = require("express");
const {
    getActions,
    getTrustedPosition,
    setTrustedPosition,
    simulateAction,
    approveAction,
    rejectAction,
    exitSafeMode,
} = require("../controllers/navigationAction.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.DIGITAL_TWIN_VIEW), getActions);
router.get("/trusted-position/vessel/:vesselId", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_VIEW), getTrustedPosition);
router.post("/trusted-position", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_ACTIONS_MANAGE), auditAction("TRUSTED_POSITION_SET", "TRUSTED_NAVIGATION_STATE"), setTrustedPosition);
router.post("/:id/simulate", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_ACTIONS_MANAGE), auditAction("DIGITAL_TWIN_SIMULATE", "NAVIGATION_ACTION"), simulateAction);
router.post("/:id/approve", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_ACTIONS_MANAGE), auditAction("NAVIGATION_ACTION_APPROVE", "NAVIGATION_ACTION"), approveAction);
router.post("/:id/reject", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_ACTIONS_MANAGE), auditAction("NAVIGATION_ACTION_REJECT", "NAVIGATION_ACTION"), rejectAction);
router.post("/safe-mode/exit", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_ACTIONS_MANAGE), auditAction("SAFE_MODE_EXIT", "SIMULATION"), exitSafeMode);

module.exports = router;
