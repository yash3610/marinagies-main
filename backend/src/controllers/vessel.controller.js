const Vessel = require("../models/Vessel");

// Get all vessels
const getVessels = async (req, res) => {
    try {
        const vessels = await Vessel.find({ isActive: true })
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
        const vessel = await Vessel.findById(req.params.id).lean();

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

// Create vessel
const createVessel = async (req, res) => {
    try {
        const vessel = await Vessel.create(req.body);

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
        const vessel = await Vessel.findByIdAndUpdate(
            req.params.id,
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
        const vessel = await Vessel.findByIdAndUpdate(
            req.params.id,
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
    createVessel,
    updateVessel,
    deleteVessel,
};