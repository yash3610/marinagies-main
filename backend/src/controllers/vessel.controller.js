const Vessel = require("../models/Vessel");
const User = require("../models/User");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const VesselCurrentState = require("../models/VesselCurrentState");
const { vesselScope } = require("../utils/dataScope");

// Get all vessels
const getVessels = async (req, res) => {
    try {
        const vessels = await Vessel.find({ isActive: true, ...vesselScope(req, "_id") })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: vessels.length,
            vessels,
        });
    } catch (error) {
        console.error("Get vessels error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch vessels",
        });
    }
};

// Get single vessel
const getVesselById = async (req, res) => {
    try {
        const vessel = await Vessel.findOne({
            _id: req.params.id,
            ...vesselScope(req, "_id"),
        }).lean();

        if (!vessel) {
            return res.status(404).json({
                success: false,
                message: "Vessel not found",
            });
        }

        res.status(200).json({
            success: true,
            vessel,
        });
    } catch (error) {
        console.error("Get vessel error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch vessel",
        });
    }
};

const getVesselStatus = async (req, res) => {
    try {
        const vessel = await Vessel.findOne({
            _id: req.params.id,
            isActive: true,
            ...vesselScope(req, "_id"),
        }).lean();
        if (!vessel) return res.status(404).json({ success: false, message: "Vessel not found" });

        const [telemetry, activeAlerts, activeIncidents] = await Promise.all([
            VesselCurrentState.findOne({ vessel: vessel._id }).lean(),
            Alert.countDocuments({ vessel: vessel._id, status: { $ne: "RESOLVED" } }),
            Incident.countDocuments({ vessel: vessel._id, status: { $nin: ["RESOLVED", "CLOSED"] } }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                vessel,
                telemetry,
                activeAlerts,
                activeIncidents,
                telemetryAgeSeconds: telemetry
                    ? Math.max(0, Math.floor((Date.now() - new Date(telemetry.sourceTimestamp).getTime()) / 1000))
                    : null,
            },
        });
    } catch (error) {
        console.error("Get vessel status error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch vessel status" });
    }
};

// Create vessel
const createVessel = async (req, res) => {
    try {
        const vessel = await Vessel.create(req.body);
        if (!req.user.allVessels) {
            await User.updateOne(
                { _id: req.user.userId },
                { $addToSet: { vesselAccess: vessel._id } }
            );
        }
        res.locals.auditVesselId = vessel._id.toString();
        res.locals.auditResourceId = vessel._id.toString();

        res.status(201).json({
            success: true,
            message: "Vessel created successfully",
            vessel,
        });
    } catch (error) {
        console.error("Create vessel error:", error);

        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Update vessel
const updateVessel = async (req, res) => {
    try {
        const vessel = await Vessel.findOneAndUpdate(
            { _id: req.params.id, ...vesselScope(req, "_id") },
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!vessel) {
            return res.status(404).json({
                success: false,
                message: "Vessel not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Vessel updated successfully",
            vessel,
        });
    } catch (error) {
        console.error("Update vessel error:", error);

        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete vessel
const deleteVessel = async (req, res) => {
    try {
        const vessel = await Vessel.findOneAndUpdate(
            { _id: req.params.id, ...vesselScope(req, "_id") },
            { isActive: false },
            { new: true }
        );

        if (!vessel) {
            return res.status(404).json({
                success: false,
                message: "Vessel not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Vessel deleted successfully",
        });
    } catch (error) {
        console.error("Delete vessel error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete vessel",
        });
    }
};

module.exports = {
    getVessels,
    getVesselById,
    getVesselStatus,
    createVessel,
    updateVessel,
    deleteVessel,
};
