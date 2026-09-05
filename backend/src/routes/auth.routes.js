const express = require("express");

const {
    login,
    register,
    getMe,
    logout,
} = require("../controllers/auth.controller");

const {
    authenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();
const rateLimit = require("../middleware/rateLimit");
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, key: (req) => `login:${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}` });
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, key: (req) => `register:${req.ip}` });

// POST /api/auth/login
router.post("/login", loginLimit, login);
router.post("/register", registerLimit, register);
router.post("/logout", logout);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

module.exports = router;