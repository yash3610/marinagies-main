const express = require("express");

const {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
} = require("../controllers/incident.controller");

const {
    authenticate,
    authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get all incidents
router.get("/", authenticate, getIncidents);

// Get single incident
router.get("/:id", authenticate, getIncidentById);

// Create incident
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SHORE_SECURITY_ANALYST"),
    createIncident
);

// Update incident
router.put(
    "/:id",
    authenticate,
    authorize("ADMIN", "SHORE_SECURITY_ANALYST"),
    updateIncident
);

module.exports = router;