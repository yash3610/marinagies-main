require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const Telemetry = require("./models/Telemetry");
const VesselCurrentState = require("./models/VesselCurrentState");
const User = require("./models/User");
const { startTelemetrySimulator } = require("./services/telemetrySimulator");
const { ACCESS_TOKEN_COOKIE } = require("./controllers/auth.controller");
const { readCookie, verifySessionToken } = require("./middleware/auth.middleware");
const { vesselRoom } = require("./services/realtime.service");
const { startEdgeArmorMonitor } = require("./services/edgeArmor.service");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Make the socket server available to route controllers for live updates.
app.set("io", io);

// Socket.IO connections use the same signed HttpOnly session as the API.
io.use(async (socket, next) => {
    try {
        const token = readCookie(socket.handshake.headers.cookie, ACCESS_TOKEN_COOKIE);
        if (!token) return next(new Error("Authentication required"));
        socket.user = verifySessionToken(token);
        const user = await User.findById(socket.user.userId)
            .select("role active vesselAccess allVessels")
            .lean();
        if (!user?.active) return next(new Error("Authentication required"));
        socket.user = {
            userId: user._id.toString(),
            role: user.role,
            vesselAccess: (user.vesselAccess || []).map(String),
            allVessels: Boolean(user.allVessels || user.role === "ADMIN"),
        };
        next();
    } catch {
        next(new Error("Invalid or expired session"));
    }
});

// Socket.IO connection
io.on("connection", async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    try {
        if (socket.user.allVessels) {
            socket.join("fleet:all");
        } else {
            socket.user.vesselAccess.forEach((vesselId) => socket.join(vesselRoom(vesselId)));
        }

        const telemetryFilter = socket.user.allVessels
            ? {}
            : { vessel: { $in: socket.user.vesselAccess } };
        const currentStates = await VesselCurrentState.find(telemetryFilter)
            .populate("vessel")
            .lean();
        let telemetryData = currentStates.map((state) => ({
            _id: state.telemetry,
            vessel: state.vessel,
            eventId: state.eventId,
            source: state.source,
            timestamp: state.sourceTimestamp,
            receivedAt: state.receivedAt,
            speed: state.speed,
            heading: state.heading,
            latitude: state.latitude,
            longitude: state.longitude,
            depth: state.depth,
            gpsSignal: state.gpsSignal,
            aisStatus: state.aisStatus,
            deviceStatus: state.deviceStatus,
            engineTemperature: state.engineTemperature,
            fuelLevel: state.fuelLevel,
            sensorNode: state.sensorNode,
            motion: state.motion,
            navigationReference: state.navigationReference,
        }));

        // Backward-compatible fallback for vessels that have historical rows but
        // have not received a sample since VesselCurrentState was introduced.
        const currentVesselIds = currentStates.map((state) => state.vessel?._id || state.vessel);
        const legacyTelemetry = await Telemetry.aggregate([
            { $match: { $and: [telemetryFilter, { vessel: { $nin: currentVesselIds } }] } },
            { $sort: { timestamp: -1 } },
            { $group: { _id: "$vessel", telemetry: { $first: "$$ROOT" } } },
            { $replaceRoot: { newRoot: "$telemetry" } },
        ]);
        await Telemetry.populate(legacyTelemetry, { path: "vessel" });
        telemetryData = telemetryData.concat(legacyTelemetry);

        socket.emit("telemetry:update", {
            success: true,
            data: telemetryData,
            timestamp: new Date().toISOString(),
        });

        console.log(
            `Telemetry sent to socket: ${socket.id} (${telemetryData.length} records)`
        );
    } catch (error) {
        console.error("Telemetry socket error:", error.message);

        socket.emit("telemetry:update", {
            success: false,
            data: [],
            message: "Failed to load telemetry data",
        });
    }

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const startServer = async () => {
    try {
        await connectDB();
        startEdgeArmorMonitor(io);
        if (process.env.ENABLE_TELEMETRY_SIMULATOR === "true") {
            startTelemetrySimulator(io);
        }

        server.listen(PORT, () => {
            console.log("");
            console.log("========================================");
            console.log("       MARINEAEGIS BACKEND");
            console.log("========================================");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(
                `Health: http://localhost:${PORT}/api/health`
            );
            console.log(`Socket.IO: ws://localhost:${PORT}`);
            console.log("========================================");
            console.log("");
        });
    } catch (error) {
        console.error("Server startup failed:");
        console.error(error.message);

        process.exit(1);
    }
};

startServer();
