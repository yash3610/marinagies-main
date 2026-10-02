const express = require("express");

const {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
} = require("../controllers/incident.controller");

const {
    authenticate,
    authorizePermission,
} = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const { auditAction } = require("../middleware/audit.middleware");

const router = express.Router();

// Get all incidents
router.get("/", authenticate, authorizePermission(PERMISSIONS.INCIDENTS_VIEW), getIncidents);

// Get single incident
router.get("/:id", authenticate, authorizePermission(PERMISSIONS.INCIDENTS_VIEW), getIncidentById);

// Create incident
router.post(
    "/",
    authenticate,
    authorizePermission(PERMISSIONS.INCIDENTS_MANAGE),
    auditAction("INCIDENT_CREATE", "INCIDENT"),
    createIncident
);

// Update incident
router.put(
    "/:id",
    authenticate,
    authorizePermission(PERMISSIONS.INCIDENTS_MANAGE),
    auditAction("INCIDENT_UPDATE", "INCIDENT"),
    updateIncident
);

module.exports = router;
