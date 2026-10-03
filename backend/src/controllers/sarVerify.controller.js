const crypto = require("node:crypto");
const mongoose = require("mongoose");
const DistressSignal = require("../models/DistressSignal");
const MmsiRegistry = require("../models/MmsiRegistry");
const SarWeatherCache = require("../models/SarWeatherCache");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { evaluateAndStoreDistressSignal } = require("../services/sarVerify.service");
const { emitVesselEvent } = require("../services/realtime.service");
const { appendIncidentEventSafely } = require("../services/incidentTimeline.service");
const { publishIndicator } = require("../services/threatIntelligence.service");

const getOverview = async (req, res) => {
    try {
        const filter = { ...vesselScope(req, "receivingVessel") };
        if (req.query.vessel) {
            if (!mongoose.isValidObjectId(req.query.vessel) || !canAccessVessel(req, req.query.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
            filter.receivingVessel = req.query.vessel;
        }
        const [signals, registry, weather] = await Promise.all([
            DistressSignal.find(filter).populate("receivingVessel", "name vesselId status").populate("review.reviewedBy", "name email role").populate("alert", "alertId severity status").populate("incident", "incidentId severity status").sort({ receivedAt: -1 }).limit(100).lean(),
            MmsiRegistry.find().sort({ confirmedHoaxCount: -1, updatedAt: -1 }).limit(100).lean(),
            SarWeatherCache.find().sort({ observedAt: -1 }).limit(30).lean(),
        ]);
        res.status(200).json({ success: true, signals, registry, weather, thresholds: { autoAccept: Number(process.env.SAR_AUTO_ACCEPT_THRESHOLD || 0.75), autoReject: Number(process.env.SAR_AUTO_REJECT_THRESHOLD || 0.40) }, stats: { total: signals.length, accepted: signals.filter((item) => item.status === "ACCEPTED").length, pendingReview: signals.filter((item) => item.status === "PENDING_REVIEW").length, rejected: signals.filter((item) => item.status === "REJECTED").length, averageTrust: signals.length ? Math.round(signals.reduce((sum, item) => sum + item.trustScore, 0) / signals.length * 100) : 0 } });
    } catch (error) {
        console.error("SARVerify overview error:", error);
        res.status(500).json({ success: false, message: "Failed to load SARVerify data" });
    }
};

const ingestSignal = async (req, res) => {
    try {
        if (!req.user?.serviceAccount && !canAccessVessel(req, req.body?.receivingVessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const signal = await evaluateAndStoreDistressSignal(req.body, req.app.get("io"));
        res.locals.auditVesselId = String(signal.receivingVessel?._id || signal.receivingVessel);
        res.locals.auditResourceId = String(signal._id);
        res.status(201).json({ success: true, message: `Distress evaluated as ${signal.decision}`, signal });
    } catch (error) {
        res.status(error.status || (error?.code === 11000 ? 409 : 400)).json({ success: false, message: error?.code === 11000 ? "Signal ID already exists" : error.message });
    }
};

const reviewSignal = async (req, res) => {
    try {
        const decision = String(req.body.decision || "").toUpperCase();
        if (!["ACCEPT", "REJECT"].includes(decision)) return res.status(400).json({ success: false, message: "decision must be ACCEPT or REJECT" });
        const signal = await DistressSignal.findOne({ _id: req.params.id, ...vesselScope(req, "receivingVessel") });
        if (!signal) return res.status(404).json({ success: false, message: "Distress signal not found" });
        if (signal.status !== "PENDING_REVIEW") return res.status(409).json({ success: false, message: "Only pending signals can be reviewed" });
        signal.status = decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";
        signal.review = { reviewedBy: req.user.userId, reviewedAt: new Date(), decision, note: String(req.body.note || "").slice(0, 500) };
        if (decision === "ACCEPT") {
            signal.navigationDispatch = { forwarded: true, forwardedAt: new Date(), destination: "AUTONOMOUS_NAVIGATION_BUS" };
            emitVesselEvent(req.app.get("io"), "sarverify:navigation-dispatch", { signalId: signal.signalId, distressNature: signal.distressNature, claimedLocation: signal.claimedLocation, trustScore: signal.trustScore, approvedBy: req.user.userId }, signal.receivingVessel);
        } else if (req.body.confirmedHoax) {
            await MmsiRegistry.findOneAndUpdate({ mmsi: signal.mmsi }, { $inc: { confirmedHoaxCount: 1 }, $set: { lastSyncedAt: new Date() }, $setOnInsert: { vesselName: "Unverified MMSI", active: false, source: "LOCAL" } }, { upsert: true, runValidators: true });
        }
        if (signal.alert) await Alert.findByIdAndUpdate(signal.alert, { status: decision === "ACCEPT" ? "RESOLVED" : "ACKNOWLEDGED", resolvedBy: decision === "ACCEPT" ? req.user.userId : null, resolvedAt: decision === "ACCEPT" ? new Date() : null });
        if (decision === "REJECT" && !signal.incident) {
            const incident = await Incident.create({ incidentId: `SARI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: signal.receivingVessel, alert: signal.alert, type: "CYBER_ATTACK", severity: "HIGH", title: "Operator-confirmed false distress signal", description: signal.review.note || `MMSI ${signal.mmsi} distress rejected after human review`, priority: "HIGH", source: "MANUAL", confidence: signal.confidence });
            signal.incident = incident._id;
            emitVesselEvent(req.app.get("io"), "incident:new", incident, signal.receivingVessel);
        }
        if (signal.incident) {
            appendIncidentEventSafely({ incident: signal.incident, vessel: signal.receivingVessel, eventType: decision === "ACCEPT" ? "ACTION_APPROVED" : "ACTION_REJECTED", title: `SAR distress ${decision.toLowerCase()}ed by operator`, description: signal.review.note, source: "SARVERIFY", actor: req.user.userId, actorRole: req.user.role, severity: decision === "REJECT" ? "HIGH" : "LOW", data: { signal: signal._id, confirmedHoax: Boolean(req.body.confirmedHoax) } });
            if (decision === "ACCEPT") await Incident.findByIdAndUpdate(signal.incident, { status: "RESOLVED", resolvedAt: new Date() });
        }
        await signal.save();
        if (decision === "REJECT" && req.body.confirmedHoax) {
            await publishIndicator({ type: "FALSE_DISTRESS", value: `${signal.mmsi}:${signal.format}`, sourceModule: "SARVERIFY", sourceRef: { model: "DistressSignal", id: String(signal._id) }, discoveryVessel: signal.receivingVessel, severity: "HIGH", confidence: signal.confidence, reason: signal.review.note || "Operator-confirmed false distress signal", extractedVector: { mmsi: signal.mmsi, format: signal.format, decision: signal.decision }, confirmedBy: req.user.userId }, req.app.get("io"));
        }
        res.locals.auditVesselId = String(signal.receivingVessel);
        res.locals.auditResourceId = String(signal._id);
        emitVesselEvent(req.app.get("io"), "sarverify:signal", signal, signal.receivingVessel);
        res.status(200).json({ success: true, message: decision === "ACCEPT" ? "Distress accepted and forwarded to navigation" : "Distress rejected by operator", signal });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Review failed" });
    }
};

const upsertRegistry = async (req, res) => {
    try {
        const entry = await MmsiRegistry.findOneAndUpdate({ mmsi: req.body.mmsi }, { $set: { vesselName: req.body.vesselName, active: req.body.active ?? true, falseAlarmCount: req.body.falseAlarmCount ?? 0, confirmedHoaxCount: req.body.confirmedHoaxCount ?? 0, lastKnownLocation: req.body.lastKnownLocation, source: req.body.source || "MANUAL", lastSyncedAt: new Date() } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
        res.locals.auditResourceId = String(entry._id);
        res.status(200).json({ success: true, message: "MMSI registry entry saved", entry });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const upsertWeather = async (req, res) => {
    try {
        const weather = await SarWeatherCache.findOneAndUpdate({ zoneId: req.body.zoneId }, { $set: { name: req.body.name, center: req.body.center, radiusKm: req.body.radiusKm ?? 150, condition: req.body.condition || "UNKNOWN", windSpeedKnots: req.body.windSpeedKnots ?? 0, waveHeightMeters: req.body.waveHeightMeters ?? 0, confirmedFalseAlarms: req.body.confirmedFalseAlarms ?? 0, observedAt: req.body.observedAt || new Date(), source: req.body.source || "LOCAL_CACHE" } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
        res.locals.auditResourceId = String(weather._id);
        res.status(200).json({ success: true, message: "Offline weather cache updated", weather });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const simulateSignal = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.receivingVessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const scenario = String(req.body.scenario || "GENUINE").toUpperCase();
        const genuine = scenario === "GENUINE";
        const signal = await evaluateAndStoreDistressSignal({ signalId: `SAR-DEMO-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`, receivingVessel: req.body.receivingVessel, format: genuine ? "AIS_EPIRB" : "DSC", mmsi: genuine ? "419001234" : "999666333", distressNature: genuine ? "SINKING" : "DISABLED", claimedLocation: req.body.claimedLocation || { latitude: 18.94, longitude: 72.84 }, signal: { protocolValid: genuine, signalStrength: genuine ? 88 : 24, sourceChannel: genuine ? "406MHZ" : "VHF-70", corroboratingSources: genuine ? ["COAST_GUARD", "EPIRB_SATELLITE", "NEARBY_VESSEL"] : [] }, simulated: true }, req.app.get("io"));
        res.locals.auditVesselId = String(signal.receivingVessel?._id || signal.receivingVessel);
        res.locals.auditResourceId = String(signal._id);
        res.status(201).json({ success: true, message: `${scenario} distress simulation evaluated`, signal });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

const bootstrapDemo = async (req, res) => {
    try {
        await MmsiRegistry.findOneAndUpdate({ mmsi: "419001234" }, { $set: { vesselName: "MV Sahyadri", active: true, falseAlarmCount: 0, confirmedHoaxCount: 0, lastKnownLocation: { latitude: 18.94, longitude: 72.84, observedAt: new Date() }, source: "DEMO", lastSyncedAt: new Date() } }, { upsert: true, new: true, runValidators: true });
        await MmsiRegistry.findOneAndUpdate({ mmsi: "999666333" }, { $set: { vesselName: "Known Demo Hoax Transmitter", active: false, falseAlarmCount: 3, confirmedHoaxCount: 2, lastKnownLocation: { latitude: 12, longitude: 68, observedAt: new Date() }, source: "DEMO", lastSyncedAt: new Date() } }, { upsert: true, new: true, runValidators: true });
        await SarWeatherCache.findOneAndUpdate({ zoneId: "DEMO-MUMBAI-OFFSHORE" }, { $set: { name: "Mumbai Offshore Demo Zone", center: { latitude: 18.94, longitude: 72.84 }, radiusKm: 180, condition: "ROUGH", windSpeedKnots: 34, waveHeightMeters: 3.8, confirmedFalseAlarms: 0, observedAt: new Date(), source: "DEMO_LOCAL_CACHE" } }, { upsert: true, new: true, runValidators: true });
        res.status(201).json({ success: true, message: "SARVerify MMSI and offline weather demo cache loaded" });
    } catch (error) { res.status(400).json({ success: false, message: error.message || "Demo setup failed" }); }
};

module.exports = { getOverview, ingestSignal, reviewSignal, upsertRegistry, upsertWeather, simulateSignal, bootstrapDemo };
