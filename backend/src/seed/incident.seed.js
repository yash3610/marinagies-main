const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Incident = require("../models/Incident");
const Vessel = require("../models/Vessel");
const Alert = require("../models/Alert");

dotenv.config();

const seedIncidents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const vessels = await Vessel.find({ isActive: true });
        const alerts = await Alert.find().sort({ detectedAt: -1 });

        if (vessels.length < 5) {
            console.log("Please seed vessels first.");
            process.exit(1);
        }

        if (alerts.length < 5) {
            console.log("Please seed alerts first.");
            process.exit(1);
        }

        await Incident.deleteMany({});

        const incidents = [
            {
                incidentId: "INC-001",
                vessel: vessels[4]._id,
                alert: alerts.find((a) => a.alertId === "ALT-001")?._id,
                type: "GPS_SPOOFING",
                severity: "CRITICAL",
                title: "GPS Spoofing Security Incident",
                description:
                    "A high-confidence GPS spoofing event was detected on MV Neptune Shield. Reported coordinates showed abnormal deviation from the expected navigation path.",
                status: "INVESTIGATING",
                priority: "URGENT",
                source: "AI_ENGINE",
                confidence: 96,
                detectedAt: new Date(Date.now() - 25 * 60 * 1000),
            },

            {
                incidentId: "INC-002",
                vessel: vessels[2]._id,
                alert: alerts.find((a) => a.alertId === "ALT-002")?._id,
                type: "ROUTE_DEVIATION",
                severity: "HIGH",
                title: "Unauthorized Route Deviation",
                description:
                    "MV Arabian Star deviated from the expected navigation corridor and requires security investigation.",
                status: "OPEN",
                priority: "HIGH",
                source: "AI_ENGINE",
                confidence: 89,
                detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },

            {
                incidentId: "INC-003",
                vessel: vessels[1]._id,
                alert: alerts.find((a) => a.alertId === "ALT-003")?._id,
                type: "AIS_ANOMALY",
                severity: "MEDIUM",
                title: "AIS Communication Anomaly",
                description:
                    "An unexpected AIS transmission pattern was detected from MV Ocean Guardian.",
                status: "CONTAINED",
                priority: "MEDIUM",
                source: "AIS",
                confidence: 78,
                detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            },

            {
                incidentId: "INC-004",
                vessel: vessels[0]._id,
                alert: alerts.find((a) => a.alertId === "ALT-004")?._id,
                type: "NAVIGATION_ANOMALY",
                severity: "LOW",
                title: "Minor Navigation Anomaly",
                description:
                    "A minor heading variation was detected and automatically resolved by the monitoring system.",
                status: "RESOLVED",
                priority: "LOW",
                source: "AI_ENGINE",
                confidence: 64,
                detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
                resolvedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
            },

            {
                incidentId: "INC-005",
                vessel: vessels[3]._id,
                alert: alerts.find((a) => a.alertId === "ALT-005")?._id,
                type: "DEVICE_FAILURE",
                severity: "HIGH",
                title: "Navigation Device Failure",
                description:
                    "The navigation monitoring device connected to MV Blue Horizon is not responding.",
                status: "OPEN",
                priority: "HIGH",
                source: "EDGE_AGENT",
                confidence: 92,
                detectedAt: new Date(Date.now() - 45 * 60 * 1000),
            },
        ];

        const createdIncidents = await Incident.insertMany(incidents);

        console.log(
            `${createdIncidents.length} incidents seeded successfully`
        );

        process.exit(0);
    } catch (error) {
        console.error("Incident seed error:", error);
        process.exit(1);
    }
};

seedIncidents();