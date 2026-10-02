const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { readCookie } = require("../utils/cookies");
const {
    normalizeRole,
    getPermissionsForRole,
} = require("../utils/accessControl");

const ACCESS_TOKEN_COOKIE = "marineaegis_access";
const REFRESH_TOKEN_COOKIE = "marineaegis_refresh";
const LEGACY_TOKEN_COOKIE = "marineaegis_session";
const TOKEN_ISSUER = "marineaegis-api";
const TOKEN_AUDIENCE = "marineaegis-dashboard";
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    normalizedRole: normalizeRole(user.role),
    permissions: getPermissionsForRole(user.role),
    vesselAccess: user.vesselAccess || [],
    fleetAccess: user.fleetAccess || [],
    allVessels: Boolean(user.allVessels || user.role === "ADMIN"),
    mfaEnabled: Boolean(user.mfa?.enabled),
});
const cookieBaseOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
});
const accessCookieOptions = () => ({ ...cookieBaseOptions(), maxAge: ACCESS_TOKEN_TTL_MS });
const refreshCookieOptions = () => ({ ...cookieBaseOptions(), maxAge: REFRESH_TOKEN_TTL_MS });

const generateAccessToken = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret || (process.env.NODE_ENV === "production" && secret.length < 32)) throw new Error("JWT_SECRET must contain at least 32 characters in production");
    return jwt.sign({ role: user.role }, secret, { subject: user._id.toString(), issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, algorithm: "HS256", expiresIn: "15m" });
};
const generateRefreshToken = () => crypto.randomBytes(48).toString("base64url");
const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const clearSessionCookies = (res) => {
    res.clearCookie(ACCESS_TOKEN_COOKIE, cookieBaseOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieBaseOptions());
    res.clearCookie(LEGACY_TOKEN_COOKIE, cookieBaseOptions());
};
const createSession = async (res, user, status, message) => {
    const refreshToken = generateRefreshToken();
    user.refreshTokenHash = hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await user.save({ validateBeforeSave: false });
    res.cookie(ACCESS_TOKEN_COOKIE, generateAccessToken(user), accessCookieOptions());
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());
    res.clearCookie(LEGACY_TOKEN_COOKIE, cookieBaseOptions());
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
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.lastLoginAt = new Date();
        res.locals.auditUser = { userId: user._id.toString(), role: user.role };
        return await createSession(res, user, 200, "Login successful");
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
        res.locals.auditUser = { userId: user._id.toString(), role: user.role };
        res.locals.auditResourceId = user._id.toString();
        return await createSession(res, user, 201, "Account created successfully.");
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
            clearSessionCookies(res);
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        return res.status(200).json({ success: true, user: publicUser(user) });
    } catch (error) {
        console.error("Get current user error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to verify session" });
    }
};

const refresh = async (req, res) => {
    try {
        const refreshToken = readCookie(req.headers.cookie, REFRESH_TOKEN_COOKIE);
        if (!refreshToken) {
            clearSessionCookies(res);
            return res.status(401).json({ success: false, message: "Refresh session required" });
        }

        const refreshTokenHash = hashRefreshToken(refreshToken);
        const user = await User.findOne({ refreshTokenHash })
            .select("+refreshTokenHash +refreshTokenExpiresAt");

        if (
            !user ||
            !user.active ||
            !user.refreshTokenExpiresAt ||
            user.refreshTokenExpiresAt.getTime() <= Date.now()
        ) {
            if (user) {
                user.refreshTokenHash = null;
                user.refreshTokenExpiresAt = null;
                await user.save({ validateBeforeSave: false });
            }
            clearSessionCookies(res);
            return res.status(401).json({ success: false, message: "Invalid or expired refresh session" });
        }

        return await createSession(res, user, 200, "Session refreshed");
    } catch (error) {
        console.error("Refresh session error:", error.message);
        clearSessionCookies(res);
        return res.status(500).json({ success: false, message: "Unable to refresh session" });
    }
};

const logout = async (req, res) => {
    try {
        const refreshToken = readCookie(req.headers.cookie, REFRESH_TOKEN_COOKIE);
        if (refreshToken) {
            await User.updateOne(
                { refreshTokenHash: hashRefreshToken(refreshToken) },
                { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } }
            );
        }
    } catch (error) {
        console.error("Logout cleanup error:", error.message);
    }

    clearSessionCookies(res);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
};
module.exports = {
    register,
    login,
    getMe,
    refresh,
    logout,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    TOKEN_ISSUER,
    TOKEN_AUDIENCE,
};
