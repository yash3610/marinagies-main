const crypto = require("node:crypto");
const DistressSignal = require("../models/DistressSignal");
const MmsiRegistry = require("../models/MmsiRegistry");
const SarWeatherCache = require("../models/SarWeatherCache");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");
const { appendIncidentEventSafely } = require("./incidentTimeline.service");

const WEIGHTS = Object.freeze({ geographicPlausibility: 0.25, technicalOrigin: 0.25, weatherConsistency: 0.15, historicalTrust: 0.15, multiSourceCorroboration: 0.20 });
const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const radians = (value) => value * Math.PI / 180;
const distanceKm = (a, b) => {
    const earthKm = 6371;
    const dLat = radians(b.latitude - a.latitude);
    const dLon = radians(b.longitude - a.longitude);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return earthKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const scoreDistressSignal = ({ input, registry, nearbyVessels = [], weather = null, falseAlarmZoneCount = 0 }) => {
    const location = input.claimedLocation;
    const distressNature = input.distressNature || "OTHER";
    const nearestKm = nearbyVessels.length ? Math.min(...nearbyVessels.map((item) => distanceKm(location, item))) : null;
    let geo = nearestKm === null ? 0.25 : nearestKm <= 5 ? 1 : nearestKm <= 20 ? 0.8 : nearestKm <= 60 ? 0.55 : 0.25;
    if (registry?.lastKnownLocation?.latitude != null) {
        const registryGap = distanceKm(location, registry.lastKnownLocation);
        geo = clamp(geo * 0.65 + (registryGap <= 20 ? 1 : registryGap <= 80 ? 0.55 : 0.15) * 0.35);
    }
    const geographicReasons = [nearbyVessels.length ? `${nearbyVessels.length} cached vessel position(s) found; nearest is ${nearestKm.toFixed(1)} km away.` : "No nearby cached vessel traffic corroborates the claimed location."];

    const protocolValid = Boolean(input.signal?.protocolValid);
    const signalStrength = Math.max(0, Math.min(100, Number(input.signal?.signalStrength || 0)));
    const technical = clamp((registry ? 0.45 : 0) + (registry?.active ? 0.15 : 0) + (protocolValid ? 0.30 : 0) + signalStrength / 100 * 0.10);
    const technicalReasons = [registry ? `MMSI ${input.mmsi} is registered${registry.active ? " and active" : " but inactive"}.` : `MMSI ${input.mmsi} is not present in the local registry.`, protocolValid ? `${input.format} protocol structure is valid.` : `${input.format} protocol structure failed validation.`];

    const condition = weather?.condition || "UNKNOWN";
    const weatherAgeHours = weather?.observedAt ? Math.max(0, (Date.now() - new Date(weather.observedAt)) / 3600000) : null;
    const weatherRelevant = ["SINKING", "COLLISION", "DISABLED", "MAN_OVERBOARD"].includes(distressNature);
    let weatherScore = !weather ? 0.4 : weatherAgeHours > 24 ? 0.45 : 0.75;
    if (weatherRelevant && ["ROUGH", "STORM"].includes(condition)) weatherScore = 1;
    if (weatherRelevant && condition === "CALM") weatherScore = 0.45;
    if (["FIRE", "MEDICAL", "PIRACY"].includes(distressNature) && weather) weatherScore = 0.8;
    const weatherReasons = [weather ? `Cached weather is ${condition.toLowerCase()} (${Number(weather.waveHeightMeters || 0).toFixed(1)} m waves), observed ${weatherAgeHours.toFixed(1)} hours ago.` : "No local weather snapshot covers the distress position."];

    const hoaxes = Number(registry?.confirmedHoaxCount || 0);
    const falseAlarms = Number(registry?.falseAlarmCount || 0);
    const historical = clamp(1 - hoaxes * 0.3 - falseAlarms * 0.08 - Number(falseAlarmZoneCount || 0) * 0.1);
    const historyReasons = [hoaxes || falseAlarms ? `Registry contains ${hoaxes} confirmed hoax(es) and ${falseAlarms} false alarm(s).` : "No known hoax history is stored for this MMSI."];

    const sources = [...new Set(input.signal?.corroboratingSources || [])];
    const corroboration = sources.length >= 3 ? 1 : sources.length === 2 ? 0.8 : sources.length === 1 ? 0.5 : 0.1;
    const corroborationReasons = [sources.length ? `${sources.length} independent source(s) corroborate the distress: ${sources.join(", ")}.` : "The distress is currently uncorroborated by an independent source."];
    const raw = { geographicPlausibility: geo, technicalOrigin: technical, weatherConsistency: weatherScore, historicalTrust: historical, multiSourceCorroboration: corroboration };
    const trustScore = Number(Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + raw[key] * weight, 0).toFixed(3));
    const acceptThreshold = Number(process.env.SAR_AUTO_ACCEPT_THRESHOLD || 0.75);
    const rejectThreshold = Number(process.env.SAR_AUTO_REJECT_THRESHOLD || 0.40);
    const decision = trustScore > acceptThreshold ? "AUTO_ACCEPTED" : trustScore < rejectThreshold ? "LIKELY_FALSE" : "HUMAN_REVIEW";
    const scores = {
        geographicPlausibility: { score: Number(geo.toFixed(3)), weight: WEIGHTS.geographicPlausibility, reasons: geographicReasons },
        technicalOrigin: { score: Number(technical.toFixed(3)), weight: WEIGHTS.technicalOrigin, reasons: technicalReasons },
        weatherConsistency: { score: Number(weatherScore.toFixed(3)), weight: WEIGHTS.weatherConsistency, reasons: weatherReasons },
        historicalTrust: { score: Number(historical.toFixed(3)), weight: WEIGHTS.historicalTrust, reasons: historyReasons },
        multiSourceCorroboration: { score: Number(corroboration.toFixed(3)), weight: WEIGHTS.multiSourceCorroboration, reasons: corroborationReasons },
    };
    return { scores, trustScore, confidence: Math.round(trustScore * 100), decision, status: decision === "AUTO_ACCEPTED" ? "ACCEPTED" : decision === "LIKELY_FALSE" ? "REJECTED" : "PENDING_REVIEW", explanation: { whatHappened: `${input.format} distress from MMSI ${input.mmsi} received for ${distressNature.replaceAll("_", " ").toLowerCase()}.`, whyItMatters: decision === "AUTO_ACCEPTED" ? "Independent evidence is strong enough to forward the signal to navigation." : decision === "LIKELY_FALSE" ? "The signal failed multiple authenticity checks and may be a course-diversion attempt." : "Evidence is mixed, so a bridge or ROC operator must decide before course alteration.", whatCausedIt: `Composite trust is ${Math.round(trustScore * 100)}% across five weighted verification dimensions.`, recommendedAction: decision === "AUTO_ACCEPTED" ? "Coordinate SAR response and validate the proposed route before altering course." : decision === "LIKELY_FALSE" ? "Do not alter course; contact maritime authorities and investigate the signal origin." : "Bridge crew or ROC should contact the claimed vessel and review all evidence." } };
};

const findContext = async (input) => {
    const states = await VesselCurrentState.find({ sourceTimestamp: { $gte: new Date(Date.now() - 6 * 3600000) } }).select("latitude longitude sourceTimestamp vessel").lean();
    const nearbyVessels = states.filter((state) => distanceKm(input.claimedLocation, state) <= 120).map((state) => ({ latitude: state.latitude, longitude: state.longitude, vessel: state.vessel, observedAt: state.sourceTimestamp }));
    const weatherRows = await SarWeatherCache.find({ observedAt: { $gte: new Date(Date.now() - 48 * 3600000) } }).lean();
    const weather = weatherRows.map((row) => ({ row, distance: distanceKm(input.claimedLocation, row.center) })).filter(({ row, distance }) => distance <= row.radiusKm).sort((a, b) => a.distance - b.distance)[0]?.row || null;
    return { nearbyVessels, weather, falseAlarmZoneCount: Number(weather?.confirmedFalseAlarms || 0) };
};

const createSecurityResponse = async ({ signal, receivingVessel, io }) => {
    if (signal.decision === "AUTO_ACCEPTED") {
        signal.navigationDispatch = { forwarded: true, forwardedAt: new Date(), destination: "AUTONOMOUS_NAVIGATION_BUS" };
        await signal.save();
        emitVesselEvent(io, "sarverify:navigation-dispatch", { signalId: signal.signalId, distressNature: signal.distressNature, claimedLocation: signal.claimedLocation, trustScore: signal.trustScore }, receivingVessel._id);
        return;
    }
    const severity = signal.decision === "LIKELY_FALSE" ? "CRITICAL" : "HIGH";
    const alert = await Alert.create({ alertId: `SAR-ALERT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: receivingVessel._id, type: "CYBER_ATTACK", severity, title: signal.decision === "LIKELY_FALSE" ? "SARVerify: Likely false distress signal" : "SARVerify: Distress requires human verification", message: signal.explanation.whatCausedIt, source: "AI_ENGINE", confidence: signal.confidence, confidenceLevel: signal.confidence >= 75 ? "HIGH" : signal.confidence >= 40 ? "MEDIUM" : "LOW", module: "SARVERIFY", explanation: signal.explanation, evidence: { distressSignal: signal._id, signalId: signal.signalId, scores: signal.scores } });
    signal.alert = alert._id;
    if (signal.decision === "LIKELY_FALSE") {
        const incident = await Incident.create({ incidentId: `SARI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: receivingVessel._id, alert: alert._id, type: "CYBER_ATTACK", severity, title: "Suspected fake distress diversion attempt", description: `${signal.explanation.whatHappened} ${signal.explanation.whatCausedIt}`, priority: "URGENT", source: "AI_ENGINE", confidence: signal.confidence });
        signal.incident = incident._id;
        appendIncidentEventSafely({ incident: incident._id, vessel: receivingVessel._id, eventType: "DETECTION", title: "SARVerify rejected distress authenticity", description: signal.explanation.whyItMatters, source: "SARVERIFY", severity, data: { signal: signal._id, scores: signal.scores } });
        emitVesselEvent(io, "incident:new", incident, receivingVessel._id);
    }
    await signal.save();
    emitVesselEvent(io, "alert:new", alert, receivingVessel._id);
};

const evaluateAndStoreDistressSignal = async (input, io) => {
    const startedAt = Date.now();
    const latitude = Number(input?.claimedLocation?.latitude);
    const longitude = Number(input?.claimedLocation?.longitude);
    if (!/^\d{9}$/.test(String(input?.mmsi || ""))) throw Object.assign(new Error("mmsi must contain exactly 9 digits"), { status: 400 });
    if (!["GMDSS", "DSC", "AIS_EPIRB"].includes(input?.format)) throw Object.assign(new Error("format must be GMDSS, DSC or AIS_EPIRB"), { status: 400 });
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw Object.assign(new Error("A valid claimedLocation is required"), { status: 400 });
    input = { ...input, claimedLocation: { latitude, longitude } };
    const receivingVessel = await Vessel.findOne({ _id: input.receivingVessel, isActive: true }).select("_id name vesselId");
    if (!receivingVessel) throw Object.assign(new Error("Receiving vessel not found or inactive"), { status: 404 });
    const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
    if (Number.isNaN(receivedAt.getTime()) || receivedAt > new Date(Date.now() + 5 * 60000)) throw Object.assign(new Error("receivedAt is invalid or too far in the future"), { status: 400 });
    const [registry, context] = await Promise.all([MmsiRegistry.findOne({ mmsi: String(input.mmsi || "") }).lean(), findContext(input)]);
    const result = scoreDistressSignal({ input, registry, ...context });
    const signal = await DistressSignal.create({ signalId: input.signalId || `SAR-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, receivingVessel: receivingVessel._id, format: input.format, mmsi: input.mmsi, distressNature: input.distressNature || "OTHER", claimedLocation: input.claimedLocation, signal: input.signal || {}, receivedAt, simulated: Boolean(input.simulated), offlineMode: true, contextSnapshot: { registry: registry ? { mmsi: registry.mmsi, vesselName: registry.vesselName, active: registry.active, falseAlarmCount: registry.falseAlarmCount, confirmedHoaxCount: registry.confirmedHoaxCount } : null, nearbyVessels: context.nearbyVessels, weather: context.weather }, ...result, processingTimeMs: Date.now() - startedAt });
    await createSecurityResponse({ signal, receivingVessel, io });
    const populated = await DistressSignal.findById(signal._id).populate("receivingVessel", "name vesselId").populate("alert", "alertId severity status").populate("incident", "incidentId severity status").lean();
    emitVesselEvent(io, "sarverify:signal", populated, receivingVessel._id);
    writeAuditLog({ actorRole: "SARVERIFY_ENGINE", vessel: receivingVessel._id, action: `DISTRESS_${signal.decision}`, resource: "DISTRESS_SIGNAL", resourceId: String(signal._id), description: signal.explanation.whatCausedIt, metadata: { signalId: signal.signalId, mmsi: signal.mmsi, trustScore: signal.trustScore, processingTimeMs: signal.processingTimeMs } }).catch((error) => console.error("SARVerify audit error:", error.message));
    return populated;
};

module.exports = { WEIGHTS, clamp, distanceKm, scoreDistressSignal, findContext, evaluateAndStoreDistressSignal };
