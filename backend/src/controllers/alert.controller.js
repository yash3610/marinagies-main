const Alert = require("../models/Alert");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { emitVesselEvent } = require("../services/realtime.service");

// Get all alerts
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find(vesselScope(req))
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
        const alert = await Alert.findOne({
            _id: req.params.id,
            ...vesselScope(req),
        }).populate(
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
        if (!canAccessVessel(req, req.body?.vessel)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const alert = await Alert.create(req.body);
        res.locals.auditResourceId = alert._id.toString();

        const populatedAlert = await Alert.findById(alert._id).populate(
            "vessel",
            "name vesselId status riskScore riskLevel"
        );

        emitVesselEvent(
            req.app.get("io"),
            "alert:new",
            populatedAlert,
            populatedAlert.vessel?._id || populatedAlert.vessel
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

        const alert = await Alert.findOne({
            _id: req.params.id,
            ...vesselScope(req),
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }

        alert.status = status;

        if (status === "RESOLVED" || status === "FALSE_POSITIVE") {
            alert.resolvedAt = new Date();
            alert.resolvedBy = req.user.userId;
        } else {
            alert.resolvedAt = null;
            alert.resolvedBy = null;
        }

        await alert.save();

        const updatedAlert = await Alert.findById(alert._id).populate(
            "vessel",
            "name vesselId status riskScore riskLevel"
        );

        emitVesselEvent(
            req.app.get("io"),
            "alert:update",
            updatedAlert,
            updatedAlert.vessel?._id || updatedAlert.vessel
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
