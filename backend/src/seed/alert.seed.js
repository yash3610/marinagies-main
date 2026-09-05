const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Alert = require("../models/Alert");
const Vessel = require("../models/Vessel");

dotenv.config();

const seedAlerts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const vessels = await Vessel.find({ isActive: true });

        if (vessels.length < 5) {
            console.log("Please seed vessels first.");
            process.exit(1);
        }

        await Alert.deleteMany({});

        const alerts = [
            {
                alertId: "ALT-001",
                vessel: vessels[4]._id,
                type: "GPS_SPOOFING",
                severity: "CRITICAL",
                title: "GPS Spoofing Detected",
                message:
                    "Significant GPS position inconsistency detected for vessel MV Neptune Shield.",
                status: "OPEN",
                source: "AI_ENGINE",
                confidence: 96,
            },
            {
                alertId: "ALT-002",
                vessel: vessels[2]._id,
                type: "ROUTE_DEVIATION",
                severity: "HIGH",
                title: "Route Deviation Detected",
                message:
                    "Vessel has deviated from its expected navigation corridor.",
                status: "OPEN",
                source: "AI_ENGINE",
                confidence: 89,
            },
            {
                alertId: "ALT-003",
                vessel: vessels[1]._id,
                type: "AIS_ANOMALY",
                severity: "MEDIUM",
                title: "AIS Behaviour Anomaly",
                message:
                    "Unexpected AIS transmission pattern detected.",
                status: "ACKNOWLEDGED",
                source: "AIS",
                confidence: 78,
            },
            {
                alertId: "ALT-004",
                vessel: vessels[0]._id,
                type: "NAVIGATION_ANOMALY",
                severity: "LOW",
                title: "Minor Navigation Anomaly",
                message:
                    "Minor heading variation detected during route monitoring.",
                status: "RESOLVED",
                source: "AI_ENGINE",
                confidence: 64,
                resolvedAt: new Date(),
            },
            {
                alertId: "ALT-005",
                vessel: vessels[3]._id,
                type: "DEVICE_FAILURE",
                severity: "HIGH",
                title: "Navigation Device Offline",
                message:
                    "Navigation monitoring device is not responding.",
                status: "OPEN",
                source: "EDGE_AGENT",
                confidence: 92,
            },
        ];

        const createdAlerts = await Alert.insertMany(alerts);

        console.log(
            `${createdAlerts.length} alerts seeded successfully`
        );

        process.exit(0);
    } catch (error) {
        console.error("Alert seed error:", error);
        process.exit(1);
    }
};

seedAlerts();