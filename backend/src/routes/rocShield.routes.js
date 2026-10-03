const express = require("express");
const { getOverview, interceptCommand, reviewCommand, beginMfaEnrollment, enableMfa, simulateCommand } = require("../controllers/rocShield.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.COMMANDS_VIEW), getOverview);
router.post("/commands/intercept", authenticate, authorizePermission(PERMISSIONS.COMMANDS_SEND), auditAction("REMOTE_COMMAND_INTERCEPT", "REMOTE_COMMAND"), interceptCommand);
router.post("/commands/:id/review", authenticate, authorizePermission(PERMISSIONS.COMMANDS_APPROVE), auditAction("REMOTE_COMMAND_REVIEW", "REMOTE_COMMAND"), reviewCommand);
router.post("/mfa/enroll", authenticate, authorizePermission(PERMISSIONS.COMMANDS_APPROVE), auditAction("ROC_MFA_ENROLL", "USER"), beginMfaEnrollment);
router.post("/mfa/enable", authenticate, authorizePermission(PERMISSIONS.COMMANDS_APPROVE), auditAction("ROC_MFA_ENABLE", "USER"), enableMfa);
router.post("/simulate", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_MANAGE), auditAction("REMOTE_COMMAND_SIMULATE", "REMOTE_COMMAND"), simulateCommand);
module.exports = router;
