const jwt = require("jsonwebtoken");
const { TOKEN_COOKIE, TOKEN_ISSUER, TOKEN_AUDIENCE } = require("../controllers/auth.controller");
const readCookie = (header, name) => {
    if (!header) return null;
    const entry = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};
const verifySessionToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Authentication is not configured");
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"], issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE });
    if (!decoded.sub || !decoded.role) throw new Error("Invalid token claims");
    return { userId: decoded.sub, role: decoded.role };
};

const authenticate = (req, res, next) => {
    try {
        const bearer = req.headers.authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
        const token = readCookie(req.headers.cookie, TOKEN_COOKIE) || bearer;
        if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
        req.user = verifySessionToken(token);
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired session" });
    }
};
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: "You do not have permission to access this resource" });
    next();
};
module.exports = { authenticate, authorize, readCookie, verifySessionToken };
