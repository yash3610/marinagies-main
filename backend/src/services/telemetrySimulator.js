const VesselCurrentState = require("../models/VesselCurrentState");
const SimulationSession = require("../models/SimulationSession");
const { ingestTelemetry } = require("./telemetry.service");
const { processGhostTraceDetection } = require("./ghostTrace.service");
const { emitTelemetry, emitVesselEvent } = require("./realtime.service");

const randomChange = (value, amount) => {
    return value + (Math.random() * 2 - 1) * amount;
};

const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};

let simulationRunning = false;

const bearingTo = (from, to) => {
    const radians = (value) => value * Math.PI / 180;
    const longitudeDelta = radians(to.longitude - from.longitude);
    const latitude1 = radians(from.latitude);
    const latitude2 = radians(to.latitude);
    return (Math.atan2(
        Math.sin(longitudeDelta) * Math.cos(latitude2),
        Math.cos(latitude1) * Math.sin(latitude2) - Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta)
    ) * 180 / Math.PI + 360) % 360;
};

const simulateTelemetry = async (io) => {
    if (simulationRunning) return;
    simulationRunning = true;
    try {
        const sessions = await SimulationSession.find({ status: "RUNNING" }).populate("vessel").lean();
        if (!sessions.length) return;
        const states = await VesselCurrentState.find({ vessel: { $in: sessions.map((session) => session.vessel._id) } }).lean();
        const stateByVessel = new Map(states.map((state) => [String(state.vessel), state]));
        const createdRecords = [];

        for (const session of sessions) {
            const vessel = session.vessel;
            const previous = stateByVessel.get(String(vessel._id)) || vessel;
            const timestamp = new Date();
            const elapsedSeconds = clamp((timestamp - new Date(session.lastTickAt || timestamp)) / 1000 || 3, 1, 10);
            const speed = clamp(randomChange(session.actual.speed || 10, 0.2), 1, 25);
            const destination = session.route?.destination;
            const heading = destination?.latitude !== undefined && destination?.longitude !== undefined
                ? bearingTo(session.actual, destination)
                : session.actual.heading;
            const headingRad = (heading * Math.PI) / 180;
            const distanceMeters = speed * 0.514444 * elapsedSeconds;
            const actualLatitude = clamp(session.actual.latitude + Math.cos(headingRad) * distanceMeters / 111320, -90, 90);
            const longitudeScale = 111320 * Math.max(Math.cos(actualLatitude * Math.PI / 180), 0.2);
            const actualLongitude = clamp(session.actual.longitude + Math.sin(headingRad) * distanceMeters / longitudeScale, -180, 180);
            const gpsLatitude = clamp(actualLatitude + (session.attack?.active ? session.attack.offsetLatitude : 0), -90, 90);
            const gpsLongitude = clamp(actualLongitude + (session.attack?.active ? session.attack.offsetLongitude : 0), -180, 180);
            const result = await ingestTelemetry({
                vessel: vessel._id,
                eventId: `simulator:${vessel._id}:${timestamp.getTime()}`,
                source: "SIMULATOR",
                timestamp,
                speed,
                heading,
                latitude: gpsLatitude,
                longitude: gpsLongitude,
                depth: previous.depth || 0,
                gpsSignal: clamp(randomChange(previous.gpsSignal ?? 95, 2), 0, 100),
                aisStatus: previous.aisStatus || "ACTIVE",
                deviceStatus: previous.deviceStatus || "ONLINE",
                engineTemperature: clamp(randomChange(previous.engineTemperature || 70, 1.5), -100, 300),
                fuelLevel: clamp((previous.fuelLevel ?? 100) - Math.random() * 0.03, 0, 100),
                sensorNode: { deviceId: `SIM-ESP32-${vessel.vesselId}`, firmwareVersion: "simulator" },
                motion: {
                    accelerometer: { x: speed > 0.5 ? 0.05 : 0, y: 0.02, z: 1 },
                    gyroscope: { x: 0, y: 0, z: speed > 0.5 ? 0.4 : 0 },
                    temperature: 32,
                    motionDetected: speed > 0.5,
                },
                navigationReference: {
                    aisLatitude: actualLatitude,
                    aisLongitude: actualLongitude,
                    gyroHeading: heading,
                    simulatedSpeed: speed,
                },
            });
            let ghostTrace = null;
            if (result.isLatest && !result.duplicate) {
                ghostTrace = await processGhostTraceDetection({
                    telemetry: result.telemetry,
                    previousState: result.previousState,
                    vessel: result.vessel,
                    io,
                });
            }
            const detected = Boolean(ghostTrace?.event?.detected);
            const hardware = detected
                ? { greenLed: false, redLed: true, buzzer: true }
                : session.hardware;
            await SimulationSession.updateOne(
                { _id: session._id },
                {
                    $set: {
                        actual: { latitude: actualLatitude, longitude: actualLongitude, speed, heading },
                        hardware,
                        lastTickAt: timestamp,
                    },
                }
            );
            emitVesselEvent(io, "simulation:update", {
                ...session,
                actual: { latitude: actualLatitude, longitude: actualLongitude, speed, heading },
                hardware,
                lastTickAt: timestamp,
                vessel,
            }, vessel._id);
            if (result.isLatest) createdRecords.push({
                ...(result.telemetry.toObject ? result.telemetry.toObject() : result.telemetry),
                vessel: result.vessel,
            });
        }
        emitTelemetry(io, createdRecords);
        console.log(`Telemetry simulated and broadcasted: ${createdRecords.length} vessels`);
    } catch (error) {
        console.error(
            "Telemetry simulation error:",
            error.message
        );
    } finally {
        simulationRunning = false;
    }
};

// ================================
// START SIMULATOR
// ================================
const startTelemetrySimulator = (io) => {
    console.log("Telemetry simulator started");

    // Run immediately once
    simulateTelemetry(io);

    // Run every 3 seconds
    const timer = setInterval(() => {
        simulateTelemetry(io);
    }, 3000);
    timer.unref();
    return timer;
};

module.exports = {
    startTelemetrySimulator,
};
