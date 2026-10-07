const express = require("express");

const {
    getVessels,
    getVesselById,
    getVesselStatus,
    createVessel,
    updateVessel,
    deleteVessel,
    getMarinePorts,
    previewMarineRoute,
} = require("../controllers/vessel.controller");

const {
    authenticate,
    authorizePermission,
} = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const { auditAction } = require("../middleware/audit.middleware");

const router = express.Router();

// Get all vessels
router.get("/", authenticate, authorizePermission(PERMISSIONS.VESSELS_VIEW), getVessels);

router.get("/marine-route/ports", authenticate, authorizePermission(PERMISSIONS.VESSELS_VIEW), getMarinePorts);
router.post("/marine-route/preview", authenticate, authorizePermission(PERMISSIONS.VESSELS_MANAGE), previewMarineRoute);

// Get single vessel
router.get("/:id/status", authenticate, authorizePermission(PERMISSIONS.VESSELS_VIEW), getVesselStatus);

router.get("/:id", authenticate, authorizePermission(PERMISSIONS.VESSELS_VIEW), getVesselById);

// Create vessel - ADMIN only
router.post(
    "/",
    authenticate,
    authorizePermission(PERMISSIONS.VESSELS_MANAGE),
    auditAction("VESSEL_CREATE", "VESSEL"),
    createVessel
);

// Update vessel - ADMIN only
router.put(
    "/:id",
    authenticate,
    authorizePermission(PERMISSIONS.VESSELS_MANAGE),
    auditAction("VESSEL_UPDATE", "VESSEL"),
    updateVessel
);

// Delete vessel - ADMIN only
router.delete(
    "/:id",
    authenticate,
    authorizePermission(PERMISSIONS.VESSELS_MANAGE),
    auditAction("VESSEL_DELETE", "VESSEL"),
    deleteVessel
);

module.exports = router;
