const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const vesselRoutes = require("./routes/vessel.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const alertRoutes = require("./routes/alert.routes");
const incidentRoutes = require("./routes/incident.routes");
const telemetryRoutes = require("./routes/telemetry.routes");

const app = express();

// CORS

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

// BODY PARSER

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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