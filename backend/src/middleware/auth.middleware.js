const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
    ACCESS_TOKEN_COOKIE,
    TOKEN_ISSUER,
    TOKEN_AUDIENCE,
} = require("../controllers/auth.controller");
const { readCookie } = require("../utils/cookies");
const {
    normalizeRole,
    getPermissionsForRole,
    hasPermission,
} = require("../utils/accessControl");
const verifySessionToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Authentication is not configured");
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"], issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE });
    if (!decoded.sub || !decoded.role) throw new Error("Invalid token claims");
    return { userId: decoded.sub, role: decoded.role };
};

const authenticate = async (req, res, next) => {
    try {
        const bearer = req.headers.authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
        const token =
            readCookie(req.headers.cookie, ACCESS_TOKEN_COOKIE) ||
            bearer;
        if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
        const session = verifySessionToken(token);
        const selectedUser = User.findById(session.userId)
            .select("_id role active vesselAccess fleetAccess allVessels mfa.enabled");
        const user = typeof selectedUser.lean === "function"
            ? await selectedUser.lean()
            : await selectedUser;
        if (!user?.active) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        req.user = {
            userId: user._id.toString(),
            role: user.role,
            normalizedRole: normalizeRole(user.role),
            permissions: getPermissionsForRole(user.role),
            vesselAccess: (user.vesselAccess || []).map(String),
            fleetAccess: user.fleetAccess || [],
            allVessels: Boolean(user.allVessels || user.role === "ADMIN"),
            mfaEnabled: Boolean(user.mfa?.enabled),
        };
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired session" });
    }
};
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    if (!normalizedAllowedRoles.includes(normalizeRole(req.user.role))) return res.status(403).json({ success: false, message: "You do not have permission to access this resource" });
    next();
};

const authorizePermission = (...requiredPermissions) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
    const permitted = requiredPermissions.every((permission) =>
        hasPermission(req.user.role, permission)
    );
    if (!permitted) return res.status(403).json({ success: false, message: "You do not have permission to access this resource" });
    next();
};

module.exports = {
    authenticate,
    authorize,
    authorizePermission,
    readCookie,
    verifySessionToken,
};
