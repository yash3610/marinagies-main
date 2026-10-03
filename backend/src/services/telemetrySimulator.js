const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const { ingestTelemetry } = require("./telemetry.service");
const { emitTelemetry } = require("./realtime.service");

const randomChange = (value, amount) => {
    return value + (Math.random() * 2 - 1) * amount;
};

const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};

const simulateTelemetry = async (io) => {
    try {
        const vessels = await Vessel.find({ isActive: true }).lean();
        const states = await VesselCurrentState.find({ vessel: { $in: vessels.map((vessel) => vessel._id) } }).lean();
        const stateByVessel = new Map(states.map((state) => [String(state.vessel), state]));
        const createdRecords = [];

        for (const vessel of vessels) {
            const previous = stateByVessel.get(String(vessel._id)) || vessel;
            const speed = clamp(randomChange(previous.speed || 0, 0.5), 0, 40);
            const heading = (randomChange(previous.heading || 0, 2) + 360) % 360;
            const headingRad = (heading * Math.PI) / 180;
            const movement = Math.max(speed, 5) * 0.00015;
            const timestamp = new Date();
            const result = await ingestTelemetry({
                vessel: vessel._id,
                eventId: `simulator:${vessel._id}:${timestamp.getTime()}`,
                source: "SIMULATOR",
                timestamp,
                speed,
                heading,
                latitude: clamp((previous.latitude || 0) + Math.cos(headingRad) * movement, -90, 90),
                longitude: clamp((previous.longitude || 0) + Math.sin(headingRad) * movement, -180, 180),
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
                    aisLatitude: clamp((previous.latitude || 0) + Math.cos(headingRad) * movement, -90, 90),
                    aisLongitude: clamp((previous.longitude || 0) + Math.sin(headingRad) * movement, -180, 180),
                    gyroHeading: heading,
                    simulatedSpeed: speed,
                },
            });
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
