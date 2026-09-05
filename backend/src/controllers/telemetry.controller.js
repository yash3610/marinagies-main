const Telemetry = require("../models/Telemetry");
const Vessel = require("../models/Vessel");

// Get latest telemetry for all vessels
const getLatestTelemetry = async (req, res) => {
    try {
        const vessels = await Vessel.find({ isActive: true })
            .select("_id name vesselId")
            .lean();

        const telemetry = [];

        for (const vessel of vessels) {
            const latest = await Telemetry.findOne({
                vessel: vessel._id,
            })
                .sort({ timestamp: -1 })
                .lean();

            if (latest) {
                telemetry.push({
                    vessel,
                    telemetry: latest,
                });
            }
        }

        res.status(200).json({
            success: true,
            count: telemetry.length,
            data: telemetry,
        });
    } catch (error) {
        console.error("Get latest telemetry error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch telemetry",
        });
    }
};

// Get latest telemetry for one vessel
const getVesselTelemetry = async (req, res) => {
    try {
        const { vesselId } = req.params;

        const vessel = await Vessel.findById(vesselId)
            .select("_id name vesselId")
            .lean();

        if (!vessel) {
            return res.status(404).json({
                success: false,
                message: "Vessel not found",
            });
        }

        const telemetry = await Telemetry.findOne({
            vessel: vessel._id,
        })
            .sort({ timestamp: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: {
                vessel,
                telemetry,
            },
        });
    } catch (error) {
        console.error("Get vessel telemetry error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch vessel telemetry",
        });
    }
};

// Create telemetry
const createTelemetry = async (req, res) => {
    try {
        const {
            vessel,
            speed,
            heading,
            latitude,
            longitude,
            depth,
            gpsSignal,
            aisStatus,
            deviceStatus,
            engineTemperature,
            fuelLevel,
        } = req.body;

        const vesselExists = await Vessel.findById(vessel);

        if (!vesselExists) {
            return res.status(404).json({
                success: false,
                message: "Vessel not found",
            });
        }

        const telemetry = await Telemetry.create({
            vessel,
            speed,
            heading,
            latitude,
            longitude,
            depth,
            gpsSignal,
            aisStatus,
            deviceStatus,
            engineTemperature,
            fuelLevel,
            timestamp: new Date(),
        });

        res.status(201).json({
            success: true,
            message: "Telemetry created successfully",
            data: telemetry,
        });
    } catch (error) {
        console.error("Create telemetry error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create telemetry",
            error: error.message,
        });
    }
};

module.exports = {
    getLatestTelemetry,
    getVesselTelemetry,
    createTelemetry,
};