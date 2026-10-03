const express = require("express");
const { overview, metrics } = require("../controllers/observability.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.OBSERVABILITY_VIEW), overview);
router.get("/metrics", metrics);
module.exports = router;
