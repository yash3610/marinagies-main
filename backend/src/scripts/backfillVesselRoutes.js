require("dotenv").config();

const mongoose = require("mongoose");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const SimulationSession = require("../models/SimulationSession");
const { ingestTelemetry } = require("../services/telemetry.service");
const { DEMO_NAVIGATION, getDemoNavigation } = require("../services/demoFleetNavigation.service");

const run = async () => {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined in backend/.env");
    await mongoose.connect(process.env.MONGO_URI);

    let updated = 0;
    for (const vesselId of Object.keys(DEMO_NAVIGATION)) {
        const navigation = getDemoNavigation(vesselId);
        const vessel = await Vessel.findOneAndUpdate(
            { vesselId, isActive: true },
            { $set: {
                latitude: navigation.latitude,
                longitude: navigation.longitude,
                heading: navigation.heading,
                destination: navigation.destination,
                route: navigation.route,
            } },
            { new: true, runValidators: true }
        );
        if (!vessel) {
            console.log(`Skipped ${vesselId}: active vessel not found`);
            continue;
        }

        const current = await VesselCurrentState.findOne({ vessel: vessel._id }).lean();
        await ingestTelemetry({
            vessel: vessel._id,
            eventId: `route-backfill:${vesselId}:${Date.now()}`,
            source: "SIMULATOR",
            timestamp: new Date(),
            latitude: navigation.latitude,
            longitude: navigation.longitude,
            heading: navigation.heading,
            speed: current?.speed ?? vessel.speed ?? 0,
            depth: current?.depth ?? 0,
            gpsSignal: current?.gpsSignal ?? 95,
            aisStatus: current?.aisStatus ?? "ACTIVE",
            deviceStatus: current?.deviceStatus ?? (vessel.status === "OFFLINE" ? "OFFLINE" : "ONLINE"),
            engineTemperature: current?.engineTemperature ?? 70,
            fuelLevel: current?.fuelLevel ?? 75,
            navigationReference: {
                aisLatitude: navigation.latitude,
                aisLongitude: navigation.longitude,
                gyroHeading: navigation.heading,
                simulatedSpeed: current?.speed ?? vessel.speed ?? 0,
            },
        });

        await SimulationSession.updateOne(
            { vessel: vessel._id },
            { $set: {
                actual: {
                    latitude: navigation.latitude,
                    longitude: navigation.longitude,
                    speed: current?.speed ?? vessel.speed ?? 0,
                    heading: navigation.heading,
                },
                route: {
                    origin: { name: navigation.route.origin, latitude: navigation.latitude, longitude: navigation.longitude },
                    destination: {
                        name: navigation.route.destination,
                        latitude: navigation.route.destinationLatitude,
                        longitude: navigation.route.destinationLongitude,
                    },
                    waypoints: navigation.route.waypoints,
                    waypointIndex: 0,
                    distanceNm: navigation.route.distanceNm,
                    planner: navigation.route.planner,
                },
            } }
        );
        updated += 1;
        console.log(`Updated ${vesselId}: ${navigation.route.origin} -> ${navigation.route.destination}`);
    }

    console.log(`Vessel route backfill complete: ${updated} vessel(s) updated`);
};

run()
    .catch((error) => {
        console.error("Vessel route backfill failed:", error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.connection.close());
