const express = require("express");
const { getEvents, getEventById } = require("../controllers/ghostTrace.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_VIEW), getEvents);
router.get("/:id", authenticate, authorizePermission(PERMISSIONS.NAVIGATION_VIEW), getEventById);

module.exports = router;
