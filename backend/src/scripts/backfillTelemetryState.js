require("dotenv").config();
const mongoose = require("mongoose");
const Telemetry = require("../models/Telemetry");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");

const run = async () => {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
    await mongoose.connect(process.env.MONGO_URI);

    const latest = await Telemetry.aggregate([
        { $sort: { vessel: 1, timestamp: -1, _id: -1 } },
        { $group: { _id: "$vessel", telemetry: { $first: "$$ROOT" } } },
    ]);

    if (!latest.length) {
        console.log("No telemetry rows found; nothing to backfill.");
        return;
    }

    await VesselCurrentState.bulkWrite(latest.map(({ telemetry }) => ({
        updateOne: {
            filter: { vessel: telemetry.vessel },
            update: {
                $set: {
                    telemetry: telemetry._id,
                    ...(telemetry.eventId ? { eventId: telemetry.eventId } : {}),
                    source: telemetry.source || "API",
                    sourceTimestamp: telemetry.timestamp,
                    receivedAt: telemetry.receivedAt || telemetry.createdAt || telemetry.timestamp,
                    speed: telemetry.speed,
                    heading: telemetry.heading,
                    latitude: telemetry.latitude,
                    longitude: telemetry.longitude,
                    depth: telemetry.depth,
                    gpsSignal: telemetry.gpsSignal,
                    aisStatus: telemetry.aisStatus,
                    deviceStatus: telemetry.deviceStatus,
                    engineTemperature: telemetry.engineTemperature,
                    fuelLevel: telemetry.fuelLevel,
                    ...(telemetry.sensorNode ? { sensorNode: telemetry.sensorNode } : {}),
                    ...(telemetry.motion ? { motion: telemetry.motion } : {}),
                    ...(telemetry.navigationReference ? { navigationReference: telemetry.navigationReference } : {}),
                },
            },
            upsert: true,
        },
    })));

    await Vessel.bulkWrite(latest.map(({ telemetry }) => ({
        updateOne: {
            filter: { _id: telemetry.vessel },
            update: {
                $set: {
                    latitude: telemetry.latitude,
                    longitude: telemetry.longitude,
                    speed: telemetry.speed,
                    heading: telemetry.heading,
                    status: telemetry.deviceStatus,
                    lastSeen: telemetry.timestamp,
                },
            },
        },
    })));

    console.log(`Backfilled current telemetry state for ${latest.length} vessel(s).`);
};

run()
    .catch((error) => {
        console.error("Telemetry state backfill failed:", error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.connection.close());
