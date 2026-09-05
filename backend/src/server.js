require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const Telemetry = require("./models/Telemetry");
const { startTelemetrySimulator } = require("./services/telemetrySimulator");

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

// Socket.IO connection
io.on("connection", async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    try {
        const telemetryData = await Telemetry.find()
            .populate("vessel")
            .sort({ timestamp: -1 });

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
        startTelemetrySimulator(io);

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