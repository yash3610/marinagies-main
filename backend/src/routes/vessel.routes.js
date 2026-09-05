const express = require("express");

const {
    getVessels,
    getVesselById,
    createVessel,
    updateVessel,
    deleteVessel,
} = require("../controllers/vessel.controller");

const {
    authenticate,
    authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get all vessels
router.get("/", authenticate, getVessels);

// Get single vessel
router.get("/:id", authenticate, getVesselById);

// Create vessel - ADMIN only
router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    createVessel
);

// Update vessel - ADMIN only
router.put(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    updateVessel
);

// Delete vessel - ADMIN only
router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    deleteVessel
);

module.exports = router;