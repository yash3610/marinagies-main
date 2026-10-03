const express = require("express");
const {
    getSessions,
    getVesselSession,
    startVoyage,
    stopVoyage,
    injectGpsSpoofing,
    resetSimulation,
} = require("../controllers/simulation.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_VIEW), getSessions);
router.get("/vessel/:vesselId", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_VIEW), getVesselSession);
router.post("/voyage/start", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_MANAGE), auditAction("VOYAGE_SIMULATION_START", "SIMULATION"), startVoyage);
router.post("/voyage/stop", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_MANAGE), auditAction("VOYAGE_SIMULATION_STOP", "SIMULATION"), stopVoyage);
router.post("/gps-spoofing", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_MANAGE), auditAction("GPS_SPOOFING_INJECT", "SIMULATION"), injectGpsSpoofing);
router.post("/reset", authenticate, authorizePermission(PERMISSIONS.ATTACK_SIMULATION_MANAGE), auditAction("ATTACK_SIMULATION_RESET", "SIMULATION"), resetSimulation);

module.exports = router;
