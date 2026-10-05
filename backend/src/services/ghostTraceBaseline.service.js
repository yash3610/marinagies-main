const GhostTraceEvent = require("../models/GhostTraceEvent");
const GhostTracePolicy = require("../models/GhostTracePolicy");
const VesselNavigationBaseline = require("../models/VesselNavigationBaseline");

const DEFAULT_THRESHOLDS = Object.freeze({ CONTAINER: 0.70, TANKER: 0.65, CARGO: 0.72, BULK_CARRIER: 0.72, PASSENGER: 0.65, OTHER: 0.75 });
const BASELINE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const BASELINE_REFRESH_MS = 60 * 60 * 1000;
const CACHE_MS = 60 * 1000;
let policyCache = null;
const baselineCache = new Map();

const getPolicy = async () => {
    if (policyCache?.expiresAt > Date.now()) return policyCache.value;
    const value = await GhostTracePolicy.findOneAndUpdate(
        { key: "DEFAULT" }, { $setOnInsert: { key: "DEFAULT" } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    policyCache = { value, expiresAt: Date.now() + CACHE_MS };
    return value;
};

const metric = (values) => {
    const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (!clean.length) return { mean: 0, standardDeviation: 0, p95: 0 };
    const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
    const variance = clean.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / clean.length;
    return {
        mean: Number(mean.toFixed(3)),
        standardDeviation: Number(Math.sqrt(variance).toFixed(3)),
        p95: Number(clean[Math.min(clean.length - 1, Math.floor(clean.length * 0.95))].toFixed(3)),
    };
};

const rebuildBaseline = async (vesselId, now = new Date()) => {
    const windowStartedAt = new Date(now.getTime() - BASELINE_WINDOW_MS);
    const rows = await GhostTraceEvent.find({
        vessel: vesselId, detected: false, createdAt: { $gte: windowStartedAt },
    }).select("signalsEvaluated").sort({ createdAt: -1 }).limit(5000).lean();
    const ais = rows.map((row) => row.signalsEvaluated?.aisGapMeters);
    const deadReckoning = rows.map((row) => row.signalsEvaluated?.deadReckoningGapMeters);
    const speeds = rows.map((row) => row.signalsEvaluated?.engineOrSimulatedSpeedKnots);
    return VesselNavigationBaseline.findOneAndUpdate(
        { vessel: vesselId },
        { $set: {
            windowStartedAt, sampleCount: rows.length, minimumSamplesMet: rows.length >= 30,
            aisGapMeters: metric(ais), deadReckoningGapMeters: metric(deadReckoning),
            speedKnots: metric(speeds), refreshedAt: now,
        } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
};

const getOrRefreshBaseline = async (vesselId) => {
    const key = String(vesselId);
    const cached = baselineCache.get(key);
    if (cached?.expiresAt > Date.now()) return cached.value;
    const baseline = await VesselNavigationBaseline.findOne({ vessel: vesselId });
    if (!baseline || Date.now() - new Date(baseline.refreshedAt).getTime() > BASELINE_REFRESH_MS) {
        const rebuilt = await rebuildBaseline(vesselId);
        baselineCache.set(key, { value: rebuilt, expiresAt: Date.now() + CACHE_MS });
        return rebuilt;
    }
    baselineCache.set(key, { value: baseline, expiresAt: Date.now() + CACHE_MS });
    return baseline;
};

const clearGhostTraceCaches = () => {
    policyCache = null;
    baselineCache.clear();
};

const effectiveThreshold = (vessel, policy) => {
    const override = Number(vessel?.ghostTracePolicy?.alertThreshold);
    if (Number.isFinite(override)) return Math.max(0.5, Math.min(0.95, override));
    return Number(policy?.classThresholds?.[vessel?.vesselType] ?? DEFAULT_THRESHOLDS[vessel?.vesselType] ?? DEFAULT_THRESHOLDS.OTHER);
};

const analyzeSlowDrift = (samples, settings = {}) => {
    const minimumSamples = Number(settings.minimumSamples || 6);
    const minimumDurationMinutes = Number(settings.minimumDurationMinutes || 30);
    const minimumNetDriftMeters = Number(settings.minimumNetDriftMeters || 150);
    const minimumSlopeMetersPerHour = Number(settings.minimumSlopeMetersPerHour || 30);
    const rows = samples
        .map((row) => ({ at: new Date(row.at).getTime(), gap: Number(row.gap) }))
        .filter((row) => Number.isFinite(row.at) && Number.isFinite(row.gap))
        .sort((a, b) => a.at - b.at);
    if (rows.length < minimumSamples) return { detected: false, score: 0, sampleCount: rows.length, reason: "Insufficient drift samples" };
    const durationHours = (rows.at(-1).at - rows[0].at) / 3600000;
    if (durationHours < minimumDurationMinutes / 60) return { detected: false, score: 0, sampleCount: rows.length, durationHours, reason: "Observation window is too short" };
    const netDriftMeters = rows.at(-1).gap - rows[0].gap;
    const slopeMetersPerHour = netDriftMeters / durationHours;
    let increases = 0;
    for (let index = 1; index < rows.length; index += 1) if (rows[index].gap >= rows[index - 1].gap) increases += 1;
    const increasingRatio = increases / (rows.length - 1);
    const detected = netDriftMeters >= minimumNetDriftMeters && slopeMetersPerHour >= minimumSlopeMetersPerHour && increasingRatio >= 0.7;
    const score = detected ? Math.min(1, 0.45 + Math.min(netDriftMeters / 1000, 0.3) + Math.min(slopeMetersPerHour / 500, 0.15) + increasingRatio * 0.1) : 0;
    return { detected, score: Number(score.toFixed(3)), sampleCount: rows.length, durationHours: Number(durationHours.toFixed(2)), netDriftMeters: Number(netDriftMeters.toFixed(1)), slopeMetersPerHour: Number(slopeMetersPerHour.toFixed(1)), increasingRatio: Number(increasingRatio.toFixed(2)), reason: detected ? "GPS-to-AIS separation increased persistently across the observation window" : "No persistent cumulative drift pattern" };
};

module.exports = { DEFAULT_THRESHOLDS, BASELINE_WINDOW_MS, metric, getPolicy, rebuildBaseline, getOrRefreshBaseline, effectiveThreshold, analyzeSlowDrift, clearGhostTraceCaches };
