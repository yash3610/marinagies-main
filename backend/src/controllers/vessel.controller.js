const Vessel = require("../models/Vessel");
const User = require("../models/User");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const VesselCurrentState = require("../models/VesselCurrentState");
const SimulationSession = require("../models/SimulationSession");
const { vesselScope } = require("../utils/dataScope");
const { listPorts, planMarineRoute } = require("../services/marineRoute.service");

const withPlannedRoute = (body) => {
    const next = { ...body, route: { ...(body.route || {}) } };
    const { originPort, destinationPort } = next.route;
    if (!originPort || !destinationPort) return next;
    const plan = planMarineRoute(originPort, destinationPort);
    next.latitude = plan.origin.latitude;
    next.longitude = plan.origin.longitude;
    next.destination = plan.destination.name;
    next.route = {
        ...next.route,
        origin: plan.origin.name,
        destination: plan.destination.name,
        destinationLatitude: plan.destination.latitude,
        destinationLongitude: plan.destination.longitude,
        waypoints: plan.waypoints,
        distanceNm: plan.distanceNm,
        planner: plan.planner,
    };
    return next;
};

const getMarinePorts = (req, res) => res.json({ success: true, ports: listPorts() });
const previewMarineRoute = (req, res) => {
    try { res.json({ success: true, route: planMarineRoute(req.body.originPort, req.body.destinationPort) }); }
    catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

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
        const vessel = await Vessel.create(withPlannedRoute(req.body));
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
        const update = withPlannedRoute(req.body);
        const vessel = await Vessel.findOneAndUpdate(
            { _id: req.params.id, ...vesselScope(req, "_id") },
            update,
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

        // Route edits intentionally reset the displayed/live simulator position
        // to the selected origin. Without this, stale telemetry can keep an old
        // vessel marker on land even though its metadata contains a new route.
        if (update.route?.originPort && update.route?.destinationPort) {
            const timestamp = new Date();
            await Promise.all([
                VesselCurrentState.updateOne(
                    { vessel: vessel._id },
                    { $set: {
                        latitude: update.latitude,
                        longitude: update.longitude,
                        heading: update.heading ?? vessel.heading,
                        "navigationReference.aisLatitude": update.latitude,
                        "navigationReference.aisLongitude": update.longitude,
                        "navigationReference.gyroHeading": update.heading ?? vessel.heading,
                        sourceTimestamp: timestamp,
                        receivedAt: timestamp,
                    } }
                ),
                SimulationSession.updateOne(
                    { vessel: vessel._id },
                    { $set: {
                        actual: {
                            latitude: update.latitude,
                            longitude: update.longitude,
                            speed: update.speed ?? vessel.speed ?? 0,
                            heading: update.heading ?? vessel.heading,
                        },
                        route: {
                            origin: { name: update.route.origin, latitude: update.latitude, longitude: update.longitude },
                            destination: {
                                name: update.route.destination,
                                latitude: update.route.destinationLatitude,
                                longitude: update.route.destinationLongitude,
                            },
                            waypoints: update.route.waypoints,
                            waypointIndex: 0,
                            distanceNm: update.route.distanceNm,
                            planner: update.route.planner,
                        },
                    } }
                ),
            ]);
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
    getMarinePorts,
    previewMarineRoute,
};
