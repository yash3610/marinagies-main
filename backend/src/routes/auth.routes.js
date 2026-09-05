const express = require("express");

const {
    login,
    register,
    getMe,
} = require("../controllers/auth.controller");

const {
    authenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);
router.post("/register", register);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

module.exports = router;