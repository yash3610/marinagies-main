const crypto = require("node:crypto");
const { authenticate, authorizePermission } = require("./auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const digest = (value) => crypto.createHash("sha256").update(String(value || "")).digest();

const isValidIngestionKey = (provided, configured = process.env.TELEMETRY_INGESTION_KEY) => {
    if (!provided || !configured || configured.length < 32) return false;
    return crypto.timingSafeEqual(digest(provided), digest(configured));
};

const telemetryIngestionAuth = (req, res, next) => {
    const provided = req.get("x-telemetry-key");
    if (provided && isValidIngestionKey(provided)) {
        req.user = {
            userId: "telemetry-agent",
            role: "TELEMETRY_AGENT",
            permissions: [PERMISSIONS.TELEMETRY_INGEST],
            vesselAccess: [],
            fleetAccess: [],
            allVessels: true,
            serviceAccount: true,
        };
        return next();
    }
    if (provided) {
        return res.status(401).json({ success: false, message: "Invalid telemetry ingestion key" });
    }
    return authenticate(req, res, () =>
        authorizePermission(PERMISSIONS.TELEMETRY_INGEST)(req, res, next)
    );
};

module.exports = { telemetryIngestionAuth, isValidIngestionKey };
