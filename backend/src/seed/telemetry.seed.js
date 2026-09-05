const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Vessel = require("../models/Vessel");
const Telemetry = require("../models/Telemetry");

dotenv.config();

const telemetryData = [
    {
        vesselId: "VSL-001",
        speed: 14.5,
        heading: 285,
        latitude: 18.94,
        longitude: 72.835,
        depth: 42,
        gpsSignal: 98,
        aisStatus: "ACTIVE",
        deviceStatus: "ONLINE",
        engineTemperature: 76,
        fuelLevel: 82,
    },
    {
        vesselId: "VSL-002",
        speed: 11.2,
        heading: 270,
        latitude: 19.076,
        longitude: 72.8777,
        depth: 38,
        gpsSignal: 95,
        aisStatus: "ACTIVE",
        deviceStatus: "ONLINE",
        engineTemperature: 72,
        fuelLevel: 74,
    },
    {
        vesselId: "VSL-003",
        speed: 9.8,
        heading: 255,
        latitude: 20.5937,
        longitude: 72.8777,
        depth: 31,
        gpsSignal: 81,
        aisStatus: "ANOMALY",
        deviceStatus: "WARNING",
        engineTemperature: 84,
        fuelLevel: 61,
    },
    {
        vesselId: "VSL-004",
        speed: 0,
        heading: 180,
        latitude: 21.0,
        longitude: 70.0,
        depth: 25,
        gpsSignal: 0,
        aisStatus: "INACTIVE",
        deviceStatus: "OFFLINE",
        engineTemperature: 0,
        fuelLevel: 47,
    },
    {
        vesselId: "VSL-005",
        speed: 7.4,
        heading: 310,
        latitude: 22.5,
        longitude: 68.9,
        depth: 29,
        gpsSignal: 54,
        aisStatus: "ANOMALY",
        deviceStatus: "WARNING",
        engineTemperature: 91,
        fuelLevel: 35,
    },
];

const seedTelemetry = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        await Telemetry.deleteMany({});

        for (const item of telemetryData) {
            const vessel = await Vessel.findOne({
                vesselId: item.vesselId,
                isActive: true,
            });

            if (!vessel) {
                console.log(`Vessel not found: ${item.vesselId}`);
                continue;
            }

            await Telemetry.create({
                vessel: vessel._id,
                speed: item.speed,
                heading: item.heading,
                latitude: item.latitude,
                longitude: item.longitude,
                depth: item.depth,
                gpsSignal: item.gpsSignal,
                aisStatus: item.aisStatus,
                deviceStatus: item.deviceStatus,
                engineTemperature: item.engineTemperature,
                fuelLevel: item.fuelLevel,
                timestamp: new Date(),
            });

            console.log(`Telemetry seeded: ${item.vesselId}`);
        }

        console.log("========================================");
        console.log("Telemetry seed completed successfully");
        console.log("========================================");

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("Telemetry seed error:", error);

        await mongoose.connection.close();
        process.exit(1);
    }
};

seedTelemetry();