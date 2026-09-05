const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const TOKEN_COOKIE = "marineaegis_session";
const TOKEN_ISSUER = "marineaegis-api";
const TOKEN_AUDIENCE = "marineaegis-dashboard";
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const sessionCookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 * 1000 });

const generateToken = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret || (process.env.NODE_ENV === "production" && secret.length < 32)) throw new Error("JWT_SECRET must contain at least 32 characters in production");
    return jwt.sign({ role: user.role }, secret, { subject: user._id.toString(), issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, algorithm: "HS256", expiresIn: "8h" });
};
const createSession = (res, user, status, message) => {
    res.cookie(TOKEN_COOKIE, generateToken(user), sessionCookieOptions());
    return res.status(status).json({ success: true, message, user: publicUser(user) });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password || email.length > 254 || password.length > 128) return res.status(400).json({ success: false, message: "Email and password are required" });
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password +passwordHash");
        const passwordHash = user?.password || user?.passwordHash || "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid";
        const passwordMatch = await bcrypt.compare(password, passwordHash).catch(() => false);
        if (!user || !passwordMatch || !user.active) return res.status(401).json({ success: false, message: "Invalid email or password" });
        return createSession(res, user, 200, "Login successful");
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to sign in" });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body || {};
        const normalizedName = typeof name === "string" ? name.trim() : "";
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
        const passwordValid = typeof password === "string" && password.length >= 10 && password.length <= 128;
        if (!normalizedName || normalizedName.length > 100 || !emailValid || normalizedEmail.length > 254 || !passwordValid) return res.status(400).json({ success: false, message: "Enter your name, a valid email and a password of 10 to 128 characters." });
        if (confirmPassword !== password) return res.status(400).json({ success: false, message: "Passwords do not match." });
        if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "Email is already registered." });
        const user = await User.create({ name: normalizedName, email: normalizedEmail, password: await bcrypt.hash(password, 12), role: "BRIDGE_OFFICER" });
        return createSession(res, user, 201, "Account created successfully.");
    } catch (error) {
        const duplicate = error.code === 11000;
        if (!duplicate) console.error("Registration error:", error.message);
        return res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? "Email is already registered." : "Unable to create account." });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password -passwordHash");
        if (!user || !user.active) {
            res.clearCookie(TOKEN_COOKIE, sessionCookieOptions());
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        return res.status(200).json({ success: true, user: publicUser(user) });
    } catch (error) {
        console.error("Get current user error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to verify session" });
    }
};
const logout = (req, res) => {
    res.clearCookie(TOKEN_COOKIE, sessionCookieOptions());
    return res.status(200).json({ success: true, message: "Logged out successfully" });
};
module.exports = { register, login, getMe, logout, TOKEN_COOKIE, TOKEN_ISSUER, TOKEN_AUDIENCE };
