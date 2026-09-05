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

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

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

// HEALTH CHECK

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "MARINEAEGIS backend is running",
        timestamp: new Date().toISOString(),
    });
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

// Website forms share the existing database and backend.
app.use("/api/forms", formRoutes);

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
    });
});

// GLOBAL ERROR HANDLER

app.use((err, req, res, next) => {
    console.error("Global error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

module.exports = app;