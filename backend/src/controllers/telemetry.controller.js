const mongoose = require("mongoose");
const Telemetry = require("../models/Telemetry");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { ingestTelemetry } = require("../services/telemetry.service");
const { emitTelemetry } = require("../services/realtime.service");
const { processGhostTraceDetection } = require("../services/ghostTrace.service");
const { processEdgeArmorTelemetry } = require("../services/edgeArmor.service");
const { shouldQueueForShore, queueOfflineEvent } = require("../services/connectivity.service");

const toLegacyTelemetry = (state) => state && ({
    _id: state.telemetry,
    vessel: state.vessel,
    eventId: state.eventId,
    source: state.source,
    timestamp: state.sourceTimestamp,
    receivedAt: state.receivedAt,
    speed: state.speed,
    heading: state.heading,
    latitude: state.latitude,
    longitude: state.longitude,
    depth: state.depth,
    gpsSignal: state.gpsSignal,
    aisStatus: state.aisStatus,
    deviceStatus: state.deviceStatus,
    engineTemperature: state.engineTemperature,
    fuelLevel: state.fuelLevel,
    sensorNode: state.sensorNode,
    motion: state.motion,
    navigationReference: state.navigationReference,
});

const latestForVessel = async (vesselId) => {
    const state = await VesselCurrentState.findOne({ vessel: vesselId }).lean();
    if (state) return toLegacyTelemetry(state);
    return Telemetry.findOne({ vessel: vesselId }).sort({ timestamp: -1 }).lean();
};

const getLatestTelemetry = async (req, res) => {
    try {
        const vessels = await Vessel.find({ isActive: true, ...vesselScope(req, "_id") })
            .select("_id name vesselId").lean();
        const states = await VesselCurrentState.find({ vessel: { $in: vessels.map((item) => item._id) } }).lean();
        const stateByVessel = new Map(states.map((state) => [String(state.vessel), state]));
        const data = await Promise.all(vessels.map(async (vessel) => ({
            vessel,
            telemetry: stateByVessel.has(String(vessel._id))
                ? toLegacyTelemetry(stateByVessel.get(String(vessel._id)))
                : await Telemetry.findOne({ vessel: vessel._id }).sort({ timestamp: -1 }).lean(),
        })));
        const available = data.filter((item) => item.telemetry);
        res.status(200).json({ success: true, count: available.length, data: available });
    } catch (error) {
        console.error("Get latest telemetry error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch telemetry" });
    }
};

const getVesselTelemetry = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.vesselId)) {
            return res.status(400).json({ success: false, message: "Invalid vessel id" });
        }
        const vessel = await Vessel.findOne({ _id: req.params.vesselId, ...vesselScope(req, "_id") })
            .select("_id name vesselId").lean();
        if (!vessel) return res.status(404).json({ success: false, message: "Vessel not found" });
        const telemetry = await latestForVessel(vessel._id);
        res.status(200).json({ success: true, data: { vessel, telemetry } });
    } catch (error) {
        console.error("Get vessel telemetry error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch vessel telemetry" });
    }
};

const getTelemetryHistory = async (req, res) => {
    try {
        const { vesselId } = req.params;
        if (!mongoose.isValidObjectId(vesselId)) {
            return res.status(400).json({ success: false, message: "Invalid vessel id" });
        }
        const vessel = await Vessel.findOne({ _id: vesselId, ...vesselScope(req, "_id") })
            .select("_id name vesselId").lean();
        if (!vessel) return res.status(404).json({ success: false, message: "Vessel not found" });

        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 1000);
        const timestamp = {};
        for (const [key, operator] of [["from", "$gte"], ["to", "$lte"], ["before", "$lt"]]) {
            if (!req.query[key]) continue;
            const parsed = new Date(req.query[key]);
            if (Number.isNaN(parsed.getTime())) {
                return res.status(400).json({ success: false, message: `${key} must be a valid date` });
            }
            timestamp[operator] = parsed;
        }
        const filter = { vessel: vessel._id, ...(Object.keys(timestamp).length ? { timestamp } : {}) };
        const data = await Telemetry.find(filter).sort({ timestamp: -1, _id: -1 }).limit(limit).lean();
        res.status(200).json({
            success: true,
            count: data.length,
            vessel,
            data,
            nextBefore: data.length === limit ? data[data.length - 1].timestamp : null,
        });
    } catch (error) {
        console.error("Get telemetry history error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch telemetry history" });
    }
};

const createTelemetry = async (req, res) => {
    try {
        const isBatch = Array.isArray(req.body?.samples);
        const samples = isBatch ? req.body.samples : [req.body];
        if (!samples.length || samples.length > 500) {
            return res.status(400).json({ success: false, message: "A batch must contain 1 to 500 samples" });
        }
        if (req.user?.serviceAccount && samples.some((sample) => !sample?.eventId)) {
            return res.status(400).json({ success: false, message: "eventId is required for device-agent ingestion" });
        }
        for (const sample of samples) {
            if (!canAccessVessel(req, sample?.vessel)) {
                return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
            }
        }

        const results = [];
        for (const sample of samples) {
            const result = await ingestTelemetry(sample);
            if (result.isLatest && !result.duplicate) {
                result.edgeArmor = await processEdgeArmorTelemetry({
                    telemetry: result.telemetry,
                    vessel: result.vessel,
                    io: req.app.get("io"),
                });
                const detectionTelemetry = result.edgeArmor?.device?.containmentState === "QUARANTINED"
                    ? { ...result.telemetry.toObject(), motion: undefined }
                    : result.telemetry;
                result.ghostTrace = await processGhostTraceDetection({
                    telemetry: detectionTelemetry,
                    previousState: result.previousState,
                    vessel: result.vessel,
                    io: req.app.get("io"),
                });
            }
            results.push(result);
        }
        const liveRecords = results
            .filter((item) => item.isLatest)
            .map((item) => ({
                ...(item.telemetry.toObject ? item.telemetry.toObject() : item.telemetry),
                vessel: item.vessel,
            }));
        if (liveRecords.length) emitTelemetry(req.app.get("io"), liveRecords);
        const queueForShore = await shouldQueueForShore();
        if (queueForShore) {
            await Promise.all(results.filter((item) => !item.duplicate).map((item) => queueOfflineEvent({
                eventKey: `telemetry:${item.telemetry.eventId || item.telemetry._id}`,
                eventType: "TELEMETRY",
                severity: item.ghostTrace?.event?.detected ? "CRITICAL" : item.edgeArmor?.analysis?.riskScore >= 70 ? "HIGH" : "LOW",
                vessel: item.vessel._id,
                sourceRef: String(item.telemetry._id),
                payload: {
                    eventId: item.telemetry.eventId || String(item.telemetry._id),
                    sourceTimestamp: item.telemetry.timestamp,
                    receivedAt: item.telemetry.receivedAt,
                    ghostTraceDetected: Boolean(item.ghostTrace?.event?.detected),
                    ghostTraceConfidence: item.ghostTrace?.event?.confidenceScore || 0,
                    edgeArmorRisk: item.edgeArmor?.analysis?.riskScore || 0,
                },
            })));
        }
        const summaries = results.map(({ telemetry, duplicate, isLatest, ghostTrace, edgeArmor }) => ({
            telemetry,
            duplicate,
            isLatest,
            ghostTrace: ghostTrace ? {
                eventId: ghostTrace.event._id,
                detected: ghostTrace.event.detected,
                confidenceScore: ghostTrace.event.confidenceScore,
                confidenceLevel: ghostTrace.event.confidenceLevel,
                alertId: ghostTrace.alert?._id || null,
                incidentId: ghostTrace.incident?._id || null,
            } : null,
            edgeArmor: edgeArmor ? {
                deviceId: edgeArmor.device._id,
                status: edgeArmor.device.status,
                containmentState: edgeArmor.device.containmentState,
                riskScore: edgeArmor.analysis.riskScore,
                alertId: edgeArmor.alert?._id || null,
            } : null,
        }));

        res.status(results.every((item) => item.duplicate) ? 200 : 201).json({
            success: true,
            message: `${results.length} telemetry sample(s) processed`,
            count: results.length,
            data: isBatch ? summaries : summaries[0].telemetry,
            ...(isBatch ? {} : { ingestion: {
                duplicate: summaries[0].duplicate,
                isLatest: summaries[0].isLatest,
                ghostTrace: summaries[0].ghostTrace,
                edgeArmor: summaries[0].edgeArmor,
            } }),
        });
    } catch (error) {
        console.error("Create telemetry error:", error);
        res.status(error.status || 500).json({ success: false, message: error.message || "Failed to create telemetry" });
    }
};

module.exports = {
    getLatestTelemetry,
    getVesselTelemetry,
    getTelemetryHistory,
    createTelemetry,
    toLegacyTelemetry,
};
