const express = require("express");

const {
    login,
    getMe,
} = require("../controllers/auth.controller");

const {
    authenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

module.exports = router;