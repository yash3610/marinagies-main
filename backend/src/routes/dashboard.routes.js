const express = require("express");

const {
    getDashboardStats,
} = require("../controllers/dashboard.controller");

const {
    authenticate,
    authorizePermission,
} = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();

router.get(
    "/stats",
    authenticate,
    authorizePermission(PERMISSIONS.DASHBOARD_VIEW),
    getDashboardStats
);

module.exports = router;
