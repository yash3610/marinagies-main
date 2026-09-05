const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const token = authorization.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token missing",
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({
                success: false,
                message: "JWT configuration missing",
            });
        }

        const decoded = jwt.verify(token, secret);

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

// ROLE AUTHORIZATION

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource",
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize,
};