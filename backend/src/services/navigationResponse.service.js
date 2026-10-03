const crypto = require("node:crypto");
const NavigationAction = require("../models/NavigationAction");
const TrustedNavigationState = require("../models/TrustedNavigationState");
const { writeAuditLog } = require("./audit.service");

const EARTH_RADIUS_METERS = 6371000;
const radians = (degrees) => degrees * Math.PI / 180;
const distanceMeters = (a, b) => {
    const latitudeDelta = radians(b.latitude - a.latitude);
    const longitudeDelta = radians(b.longitude - a.longitude);
    const value = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const recordTrustedPosition = async ({ telemetry, vesselId, setBy = null, reason, source = "MULTI_SENSOR" }) => {
    const timestamp = new Date(telemetry.timestamp || telemetry.sourceTimestamp || Date.now());
    const existing = await TrustedNavigationState.findOne({ vessel: vesselId });
    if (existing?.locked && source === "MULTI_SENSOR") return existing;
    if (existing && new Date(existing.trustedAt) > timestamp) return existing;
    return TrustedNavigationState.findOneAndUpdate(
        { vessel: vesselId },
        {
            $set: {
                telemetry: telemetry._id || telemetry.telemetry || null,
                latitude: Number(telemetry.latitude),
                longitude: Number(telemetry.longitude),
                speed: Number(telemetry.speed || 0),
                heading: Number(telemetry.heading || 0),
                source,
                trustScore: 1,
                reason: reason || "GPS, AIS, gyro and physical-motion signals agreed",
                trustedAt: timestamp,
                setBy,
                locked: source === "MANUAL" || source === "DIGITAL_TWIN",
            },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
};

const evaluateDigitalTwin = (action, now = new Date()) => {
    const trusted = action.trustedPosition;
    const suspicious = action.suspiciousPosition;
    const ageSeconds = Math.max(0, (now - new Date(trusted.timestamp)) / 1000);
    const separationMeters = distanceMeters(trusted, suspicious);
    const checks = {
        trustedPositionAvailable: Number.isFinite(trusted.latitude) && Number.isFinite(trusted.longitude),
        trustedPositionFresh: ageSeconds <= 15 * 60,
        operationalSpeedSafe: Number(trusted.speed || 0) <= 30,
        correctionWithinDemoLimit: separationMeters <= 5000,
        requiresHumanApproval: true,
        trustedPositionAgeSeconds: Math.round(ageSeconds),
        correctionDistanceMeters: Math.round(separationMeters),
    };
    const safe = checks.trustedPositionAvailable
        && checks.trustedPositionFresh
        && checks.operationalSpeedSafe
        && checks.correctionWithinDemoLimit;
    return {
        result: safe ? "SAFE" : "UNSAFE",
        checks,
        summary: safe
            ? "The trusted position is recent, physically plausible and within the configured correction limit. Human approval is still required."
            : "The proposed correction failed one or more safety checks and cannot be applied.",
        simulatedAt: now,
    };
};

const runDigitalTwin = async (action) => {
    action.status = "SIMULATING";
    await action.save();
    action.digitalTwin = evaluateDigitalTwin(action);
    action.status = action.digitalTwin.result === "SAFE" ? "AWAITING_APPROVAL" : "FAILED";
    await action.save();
    return action;
};

const proposeNavigationAction = async ({ vessel, telemetry, event, alert, incident }) => {
    const existing = await NavigationAction.findOne({
        vessel: vessel._id,
        alert: alert?._id || null,
        status: { $in: ["PROPOSED", "SIMULATING", "AWAITING_APPROVAL"] },
    });
    if (existing) return existing;

    let trusted = await TrustedNavigationState.findOne({ vessel: vessel._id }).lean();
    if (!trusted) {
        const fallback = event.signalsEvaluated?.deadReckoningExpectedPosition
            || event.signalsEvaluated?.aisPosition;
        if (!fallback) return null;
        trusted = {
            ...fallback,
            speed: event.signalsEvaluated?.engineOrSimulatedSpeedKnots || telemetry.speed || 0,
            heading: event.signalsEvaluated?.gyrocompassHeading || telemetry.heading || 0,
            trustedAt: telemetry.timestamp,
        };
    }

    const action = await NavigationAction.create({
        actionId: `NAV-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        vessel: vessel._id,
        alert: alert?._id || null,
        incident: incident?._id || null,
        detectionEvent: event._id,
        type: "USE_TRUSTED_POSITION",
        trustedPosition: {
            latitude: trusted.latitude,
            longitude: trusted.longitude,
            speed: trusted.speed || 0,
            heading: trusted.heading || 0,
            timestamp: trusted.trustedAt || telemetry.timestamp,
        },
        suspiciousPosition: {
            latitude: telemetry.latitude,
            longitude: telemetry.longitude,
            speed: telemetry.speed || 0,
            heading: telemetry.heading || 0,
            timestamp: telemetry.timestamp,
        },
        reason: "GhostTrace recommends isolating the suspicious GPS feed and navigating from the last multi-sensor trusted position.",
    });
    await runDigitalTwin(action);
    writeAuditLog({
        actorRole: "DIGITAL_TWIN_ENGINE",
        vessel: vessel._id,
        action: "NAVIGATION_ACTION_SIMULATED",
        resource: "NAVIGATION_ACTION",
        resourceId: String(action._id),
        description: action.digitalTwin.summary,
        metadata: { result: action.digitalTwin.result, checks: action.digitalTwin.checks },
    }).catch((error) => console.error("Digital Twin audit error:", error.message));
    return action;
};

module.exports = {
    recordTrustedPosition,
    evaluateDigitalTwin,
    runDigitalTwin,
    proposeNavigationAction,
};
