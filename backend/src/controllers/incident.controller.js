const Incident = require("../models/Incident");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { emitVesselEvent } = require("../services/realtime.service");

// Get all incidents
const getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find(vesselScope(req))
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .populate("alert", "alertId type severity title status")
            .populate("assignedTo", "name email role")
            .sort({ detectedAt: -1 });

        res.status(200).json({
            success: true,
            count: incidents.length,
            incidents,
        });
    } catch (error) {
        console.error("Get incidents error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch incidents",
        });
    }
};

// Get single incident
const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findOne({
            _id: req.params.id,
            ...vesselScope(req),
        })
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .populate("alert", "alertId type severity title status")
            .populate("assignedTo", "name email role");

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found",
            });
        }

        res.status(200).json({
            success: true,
            incident,
        });
    } catch (error) {
        console.error("Get incident error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch incident",
        });
    }
};

// Create incident
const createIncident = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const incident = await Incident.create(req.body);
        res.locals.auditResourceId = incident._id.toString();

        const populatedIncident = await Incident.findById(
            incident._id
        )
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .populate("alert", "alertId type severity title status")
            .populate("assignedTo", "name email role");

        emitVesselEvent(
            req.app.get("io"),
            "incident:new",
            populatedIncident,
            populatedIncident.vessel?._id || populatedIncident.vessel
        );

        res.status(201).json({
            success: true,
            message: "Incident created successfully",
            incident: populatedIncident,
        });
    } catch (error) {
        console.error("Create incident error:", error);

        res.status(400).json({
            success: false,
            message: error.message || "Failed to create incident",
        });
    }
};

// Update incident
const updateIncident = async (req, res) => {
    try {
        const incident = await Incident.findOne({
            _id: req.params.id,
            ...vesselScope(req),
        });

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found",
            });
        }

        const {
            status,
            priority,
            assignedTo,
            description,
        } = req.body;

        if (status !== undefined) {
            incident.status = status;

            if (status === "RESOLVED") {
                incident.resolvedAt = new Date();
            } else {
                incident.resolvedAt = null;
            }

            if (status === "CLOSED") {
                incident.closedAt = new Date();
            } else {
                incident.closedAt = null;
            }
        }

        if (priority !== undefined) {
            incident.priority = priority;
        }

        if (assignedTo !== undefined) {
            incident.assignedTo = assignedTo;
        }

        if (description !== undefined) {
            incident.description = description;
        }

        await incident.save();

        const updatedIncident = await Incident.findById(
            incident._id
        )
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .populate("alert", "alertId type severity title status")
            .populate("assignedTo", "name email role");

        emitVesselEvent(
            req.app.get("io"),
            "incident:update",
            updatedIncident,
            updatedIncident.vessel?._id || updatedIncident.vessel
        );

        res.status(200).json({
            success: true,
            message: "Incident updated successfully",
            incident: updatedIncident,
        });
    } catch (error) {
        console.error("Update incident error:", error);

        res.status(400).json({
            success: false,
            message: error.message || "Failed to update incident",
        });
    }
};

module.exports = {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
};
