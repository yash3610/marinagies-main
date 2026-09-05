const Alert = require("../models/Alert");

// Get all alerts
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .sort({ detectedAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error("Get alerts error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch alerts",
        });
    }
};

// Get single alert
const getAlertById = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id).populate(
            "vessel",
            "name vesselId status riskScore riskLevel"
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }

        res.status(200).json({
            success: true,
            alert,
        });
    } catch (error) {
        console.error("Get alert error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch alert",
        });
    }
};

// Create alert
const createAlert = async (req, res) => {
    try {
        const alert = await Alert.create(req.body);

        const populatedAlert = await Alert.findById(alert._id).populate(
            "vessel",
            "name vesselId status riskScore riskLevel"
        );

        res.status(201).json({
            success: true,
            message: "Alert created successfully",
            alert: populatedAlert,
        });
    } catch (error) {
        console.error("Create alert error:", error);

        res.status(400).json({
            success: false,
            message: error.message || "Failed to create alert",
        });
    }
};

// Update alert status
const updateAlert = async (req, res) => {
    try {
        const { status } = req.body;

        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }

        alert.status = status;

        if (status === "RESOLVED") {
            alert.resolvedAt = new Date();
        } else {
            alert.resolvedAt = null;
        }

        await alert.save();

        const updatedAlert = await Alert.findById(alert._id).populate(
            "vessel",
            "name vesselId status riskScore riskLevel"
        );

        res.status(200).json({
            success: true,
            message: "Alert updated successfully",
            alert: updatedAlert,
        });
    } catch (error) {
        console.error("Update alert error:", error);

        res.status(400).json({
            success: false,
            message: error.message || "Failed to update alert",
        });
    }
};

module.exports = {
    getAlerts,
    getAlertById,
    createAlert,
    updateAlert,
};