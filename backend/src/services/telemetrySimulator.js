const Telemetry = require("../models/Telemetry");

const randomChange = (value, amount) => {
    return value + (Math.random() * 2 - 1) * amount;
};

const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};

const simulateTelemetry = async (io) => {
    try {
        const telemetryRecords = await Telemetry.find().populate("vessel");

        const updatedRecords = [];

        for (const telemetry of telemetryRecords) {
            // ================================
            // SPEED
            // ================================
            telemetry.speed = clamp(
                randomChange(telemetry.speed, 0.5),
                0,
                40
            );

            // ================================
            // HEADING
            // ================================
            telemetry.heading =
                (randomChange(telemetry.heading, 2) + 360) % 360;

            // ================================
            // GPS SIGNAL
            // ================================
            telemetry.gpsSignal = clamp(
                randomChange(telemetry.gpsSignal, 2),
                0,
                100
            );

            // ================================
            // ENGINE TEMPERATURE
            // ================================
            telemetry.engineTemperature = clamp(
                randomChange(telemetry.engineTemperature, 1.5),
                0,
                150
            );

            // ================================
            // FUEL
            // ================================
            telemetry.fuelLevel = clamp(
                telemetry.fuelLevel - Math.random() * 0.03,
                0,
                100
            );

            // ================================
            // VESSEL MOVEMENT
            // ================================

            // Convert heading from degrees to radians
            const headingRad =
                (telemetry.heading * Math.PI) / 180;

            // Demo movement speed
            // Increased intentionally so movement
            // is clearly visible on the map.
            const movement =
                Math.max(telemetry.speed, 5) * 0.00015;

            // Move vessel according to heading
            telemetry.latitude = clamp(
                telemetry.latitude +
                Math.cos(headingRad) * movement,
                -90,
                90
            );

            telemetry.longitude = clamp(
                telemetry.longitude +
                Math.sin(headingRad) * movement,
                -180,
                180
            );

            // ================================
            // TIMESTAMP
            // ================================
            telemetry.timestamp = new Date();

            // Save updated telemetry
            await telemetry.save();

            updatedRecords.push(telemetry);
        }

        // ================================
        // BROADCAST LIVE TELEMETRY
        // ================================
        io.emit("telemetry:update", {
            success: true,
            data: updatedRecords,
            timestamp: new Date().toISOString(),
        });

        console.log(
            `Telemetry simulated and broadcasted: ${updatedRecords.length} vessels`
        );
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
    setInterval(() => {
        simulateTelemetry(io);
    }, 3000);
};

module.exports = {
    startTelemetrySimulator,
};