const express = require("express");
const cors = require("cors");
const path = require("node:path");
const formRoutes = require("./website/routes/formRoutes");

const authRoutes = require("./routes/auth.routes");
const vesselRoutes = require("./routes/vessel.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const alertRoutes = require("./routes/alert.routes");
const incidentRoutes = require("./routes/incident.routes");
const telemetryRoutes = require("./routes/telemetry.routes");
const usersRoutes = require("./routes/users.routes");
const auditLogRoutes = require("./routes/auditLog.routes");
const ghostTraceRoutes = require("./routes/ghostTrace.routes");
const simulationRoutes = require("./routes/simulation.routes");
const navigationActionRoutes = require("./routes/navigationAction.routes");
const deviceRoutes = require("./routes/device.routes");
const networkRoutes = require("./routes/network.routes");
const agentWatchRoutes = require("./routes/agentWatch.routes");
const fleetChokeRoutes = require("./routes/fleetChoke.routes");
const sarVerifyRoutes = require("./routes/sarVerify.routes");
const rocShieldRoutes = require("./routes/rocShield.routes");
const recoveryShieldRoutes = require("./routes/recoveryShield.routes");
const intelligenceRoutes = require("./routes/intelligence.routes");
const observabilityRoutes = require("./routes/observability.routes");
const mongoose = require("mongoose");
const { requestContext, apiRateLimit, rejectDangerousInput } = require("./middleware/platform.middleware");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Content-Security-Policy", "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:");
    if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});
app.use(requestContext);
app.use(apiRateLimit);

// CORS

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

// BODY PARSER

app.use(express.json({ limit: "100kb", type: "application/json" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(rejectDangerousInput);

// HEALTH CHECK

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "MARINEAEGIS backend is running",
        timestamp: new Date().toISOString(),
    });
});
app.get("/api/health/ready", (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    res.status(databaseReady ? 200 : 503).json({ success: databaseReady, status: databaseReady ? "READY" : "NOT_READY", dependencies: { mongodb: databaseReady ? "UP" : "DOWN" }, uptimeSeconds: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

// AUTH ROUTES

app.use("/api/auth", authRoutes);

// VESSEL ROUTES

app.use("/api/vessels", vesselRoutes);

// DASHBOARD ROUTES

app.use("/api/dashboard", dashboardRoutes);

// ALERT ROUTES
app.use("/api/alerts", alertRoutes);

// INCIDENT ROUTES
app.use("/api/incidents", incidentRoutes);

// TELEMETRY ROUTES
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/ghosttrace", ghostTraceRoutes);
app.use("/api/attack-simulation", simulationRoutes);
app.use("/api/navigation-actions", navigationActionRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/agentwatch", agentWatchRoutes);
app.use("/api/fleetchoke", fleetChokeRoutes);
app.use("/api/sarverify", sarVerifyRoutes);
app.use("/api/rocshield", rocShieldRoutes);
app.use("/api/recoveryshield", recoveryShieldRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/observability", observabilityRoutes);

// Website forms share the existing database and backend.
app.use("/api/forms", formRoutes);

// USER MANAGEMENT ROUTES
app.use("/api/users", usersRoutes);

// AUDIT LOG ROUTES
app.use("/api/audit-logs", auditLogRoutes);

if (process.env.NODE_ENV === "production") {
    const dist = path.resolve(__dirname, "../../frontend/dist");
    app.use(express.static(dist));
    app.get(["/dashboard", "/dashboard/{*path}"], (req, res) => res.sendFile(path.join(dist, "dashboard.html")));
    app.get("/{*path}", (req, res, next) => {
        if (req.path.startsWith("/api/") || path.extname(req.path)) return next();
        res.sendFile(path.join(dist, "index.html"));
    });
}

// 404 HANDLER

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        requestId: req.requestId,
    });
});

// GLOBAL ERROR HANDLER

app.use((err, req, res, next) => {
    console.error("Global error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
        requestId: req.requestId,
    });
});

module.exports = app;
