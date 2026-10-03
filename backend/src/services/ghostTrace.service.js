const crypto = require("node:crypto");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const Vessel = require("../models/Vessel");
const GhostTraceEvent = require("../models/GhostTraceEvent");
const SimulationSession = require("../models/SimulationSession");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");
const { recordTrustedPosition, proposeNavigationAction } = require("./navigationResponse.service");
const { appendIncidentEventSafely } = require("./incidentTimeline.service");

const EARTH_RADIUS_METERS = 6371000;
const KNOT_TO_METERS_PER_SECOND = 0.514444;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const radians = (degrees) => (degrees * Math.PI) / 180;

const haversineMeters = (a, b) => {
    const latitudeDelta = radians(b.latitude - a.latitude);
    const longitudeDelta = radians(b.longitude - a.longitude);
    const latitude1 = radians(a.latitude);
    const latitude2 = radians(b.latitude);
    const value = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const projectPosition = (position, headingDegrees, distanceMeters) => {
    const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
    const bearing = radians(headingDegrees);
    const latitude1 = radians(position.latitude);
    const longitude1 = radians(position.longitude);
    const latitude2 = Math.asin(
        Math.sin(latitude1) * Math.cos(angularDistance)
        + Math.cos(latitude1) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const longitude2 = longitude1 + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude1),
        Math.cos(angularDistance) - Math.sin(latitude1) * Math.sin(latitude2)
    );
    return { latitude: latitude2 * 180 / Math.PI, longitude: longitude2 * 180 / Math.PI };
};

const headingDifference = (first, second) => Math.abs(((first - second + 540) % 360) - 180);

const courseBetween = (from, to) => {
    const longitudeDelta = radians(to.longitude - from.longitude);
    const latitude1 = radians(from.latitude);
    const latitude2 = radians(to.latitude);
    return (Math.atan2(
        Math.sin(longitudeDelta) * Math.cos(latitude2),
        Math.cos(latitude1) * Math.sin(latitude2) - Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta)
    ) * 180 / Math.PI + 360) % 360;
};

const analyzeGhostTrace = (telemetry, previousState, configuredThreshold) => {
    const thresholdValue = Number(configuredThreshold ?? process.env.GHOSTTRACE_ALERT_THRESHOLD ?? 0.7);
    const threshold = clamp(Number.isFinite(thresholdValue) ? thresholdValue : 0.7, 0.5, 0.95);
    const current = { latitude: Number(telemetry.latitude), longitude: Number(telemetry.longitude) };
    const reference = telemetry.navigationReference || {};
    const motion = telemetry.motion || {};
    const accelerometer = motion.accelerometer || {};
    const gyroscope = motion.gyroscope || {};
    const accelerationMagnitude = [accelerometer.x, accelerometer.y, accelerometer.z].every(Number.isFinite)
        ? Math.sqrt(accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2)
        : null;
    const gyroscopeMagnitude = [gyroscope.x, gyroscope.y, gyroscope.z].every(Number.isFinite)
        ? Math.sqrt(gyroscope.x ** 2 + gyroscope.y ** 2 + gyroscope.z ** 2)
        : null;
    const physicalMotion = typeof motion.motionDetected === "boolean"
        ? motion.motionDetected
        : accelerationMagnitude !== null && gyroscopeMagnitude !== null
            ? Math.abs(accelerationMagnitude - 1) > 0.08 || gyroscopeMagnitude > 2
            : null;

    let elapsedSeconds = null;
    let gpsDistanceMeters = null;
    let impliedSpeedKnots = null;
    let expectedPosition = null;
    let deadReckoningGapMeters = null;
    let boundingRadiusMeters = null;
    let gpsCourseHeading = null;
    if (previousState?.sourceTimestamp) {
        elapsedSeconds = (new Date(telemetry.timestamp) - new Date(previousState.sourceTimestamp)) / 1000;
        if (elapsedSeconds > 0 && elapsedSeconds <= 3600) {
            gpsDistanceMeters = haversineMeters(previousState, current);
            gpsCourseHeading = gpsDistanceMeters > 5 ? courseBetween(previousState, current) : null;
            impliedSpeedKnots = gpsDistanceMeters / elapsedSeconds / KNOT_TO_METERS_PER_SECOND;
            const speed = Number(reference.simulatedSpeed ?? previousState.speed ?? telemetry.speed ?? 0);
            const heading = Number(reference.gyroHeading ?? previousState.heading ?? telemetry.heading ?? 0);
            expectedPosition = projectPosition(previousState, heading, speed * KNOT_TO_METERS_PER_SECOND * elapsedSeconds);
            deadReckoningGapMeters = haversineMeters(expectedPosition, current);
            boundingRadiusMeters = Math.max(40, 20 + elapsedSeconds * 1.5);
        }
    }

    let aisGapMeters = null;
    if (Number.isFinite(reference.aisLatitude) && Number.isFinite(reference.aisLongitude)) {
        aisGapMeters = haversineMeters(current, {
            latitude: reference.aisLatitude,
            longitude: reference.aisLongitude,
        });
    }
    const gyroHeadingDelta = Number.isFinite(reference.gyroHeading) && gpsCourseHeading !== null
        ? headingDifference(gpsCourseHeading, reference.gyroHeading)
        : null;
    const simulatedSpeedDelta = Number.isFinite(reference.simulatedSpeed)
        ? Math.abs(Number(telemetry.speed) - reference.simulatedSpeed)
        : null;

    const deadReckoning = deadReckoningGapMeters === null || boundingRadiusMeters === null
        ? 0 : clamp((deadReckoningGapMeters - boundingRadiusMeters) / Math.max(boundingRadiusMeters * 4, 1));
    const impossibleSpeed = impliedSpeedKnots === null ? 0 : clamp((impliedSpeedKnots - 45) / 80);
    const physicalMotionMismatch = physicalMotion === false && gpsDistanceMeters !== null
        ? clamp((gpsDistanceMeters - 40) / 200) : 0;
    const aisCrossReference = aisGapMeters === null ? 0 : clamp((aisGapMeters - 75) / 500);
    const headingMismatch = gyroHeadingDelta === null ? 0 : clamp((gyroHeadingDelta - 15) / 90);
    const speedMismatch = simulatedSpeedDelta === null ? 0 : clamp((simulatedSpeedDelta - 5) / 30);

    let score = deadReckoning * 0.25
        + impossibleSpeed * 0.2
        + physicalMotionMismatch * 0.3
        + aisCrossReference * 0.15
        + Math.max(headingMismatch, speedMismatch) * 0.1;
    const agreeingSignals = [deadReckoning, impossibleSpeed, physicalMotionMismatch, aisCrossReference, headingMismatch, speedMismatch]
        .filter((value) => value >= 0.6).length;
    if (agreeingSignals >= 3) score += 0.1;
    const confidenceScore = Number(clamp(score).toFixed(3));
    const detected = confidenceScore >= threshold;
    const confidenceLevel = confidenceScore >= 0.7 ? "HIGH" : confidenceScore >= 0.4 ? "MEDIUM" : "LOW";
    const causes = [];
    if (deadReckoning >= 0.5) causes.push("GPS is outside the dead-reckoning safety radius");
    if (impossibleSpeed >= 0.5) causes.push("the GPS movement implies an unrealistic vessel speed");
    if (physicalMotionMismatch >= 0.5) causes.push("GPS reports movement while the MPU6050 reports no matching physical motion");
    if (aisCrossReference >= 0.5) causes.push("GPS and AIS positions disagree");
    if (headingMismatch >= 0.5) causes.push("GPS heading and gyrocompass heading disagree");
    if (speedMismatch >= 0.5) causes.push("reported and independently simulated speeds disagree");
    const strongestType = aisCrossReference >= Math.max(deadReckoning, impossibleSpeed, physicalMotionMismatch)
        ? "AIS_CROSS_REFERENCE_FAIL"
        : impossibleSpeed >= 0.6 ? "IMPLAUSIBLE_TRAJECTORY"
            : detected ? "GPS_POSITION_INCONSISTENT" : "SIGNALS_CONSISTENT";

    return {
        detected,
        confidenceScore,
        confidenceLevel,
        threshold,
        alertType: strongestType,
        signalsEvaluated: {
            gpsReportedPosition: current,
            deadReckoningExpectedPosition: expectedPosition,
            positionDeltaMeters: gpsDistanceMeters,
            deadReckoningGapMeters,
            deadReckoningBoundingRadiusMeters: boundingRadiusMeters,
            impliedSpeedKnots,
            gyrocompassHeading: reference.gyroHeading ?? null,
            gpsCourseHeading,
            engineOrSimulatedSpeedKnots: reference.simulatedSpeed ?? telemetry.speed ?? null,
            aisPosition: Number.isFinite(reference.aisLatitude) ? { latitude: reference.aisLatitude, longitude: reference.aisLongitude } : null,
            aisGapMeters,
            mpu6050: { accelerationMagnitude, gyroscopeMagnitude, physicalMotion },
        },
        anomalyScores: {
            deadReckoning,
            impossibleSpeed,
            physicalMotionMismatch,
            aisCrossReference,
            headingMismatch,
            speedMismatch,
        },
        explanation: detected ? {
            whatHappened: `GhostTrace found ${causes.length} independent navigation inconsistency signal(s).`,
            whyItMatters: "The displayed GPS position may not represent the vessel's real physical movement.",
            whatCausedIt: causes.join("; ") || "multiple navigation signals did not agree",
            recommendedAction: "Do not navigate from GPS alone. Verify radar, visual position, AIS, gyrocompass and the ESP32 motion node before changing course.",
        } : {
            whatHappened: "The available GPS, AIS, gyro and physical-motion signals are within configured limits.",
            whyItMatters: "Independent sensors currently support the reported vessel movement.",
            whatCausedIt: "No multi-sensor spoofing pattern crossed the alert threshold.",
            recommendedAction: "Continue monitoring navigation signals.",
        },
    };
};

const processGhostTraceDetection = async ({ telemetry, previousState, vessel, io }) => {
    const analysis = analyzeGhostTrace(telemetry.toObject ? telemetry.toObject() : telemetry, previousState);
    const event = await GhostTraceEvent.create({
        vessel: vessel._id,
        telemetry: telemetry._id,
        ...analysis,
    });
    if (!analysis.detected) {
        await recordTrustedPosition({
            telemetry,
            vesselId: vessel._id,
            reason: "GhostTrace multi-sensor score remained below the alert threshold",
        });
        return { event, alert: null, incident: null, navigationAction: null };
    }

    const confidence = Math.round(analysis.confidenceScore * 100);
    const severity = confidence >= 90 ? "CRITICAL" : confidence >= 80 ? "HIGH" : "MEDIUM";
    const recentAlert = await Alert.findOne({
        vessel: vessel._id,
        type: "GPS_SPOOFING",
        status: { $in: ["OPEN", "ACKNOWLEDGED"] },
        detectedAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
    });
    let alert = recentAlert;
    let createdAlert = false;
    if (!alert) {
        alert = await Alert.create({
            alertId: `GT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            vessel: vessel._id,
            type: "GPS_SPOOFING",
            severity,
            title: "GhostTrace: Possible GPS Spoofing",
            message: analysis.explanation.whatCausedIt,
            source: telemetry.motion ? "ESP32" : "AI_ENGINE",
            confidence,
            confidenceLevel: analysis.confidenceLevel,
            module: "GHOSTTRACE",
            explanation: analysis.explanation,
            evidence: { signalsEvaluated: analysis.signalsEvaluated, anomalyScores: analysis.anomalyScores },
            detectionEvent: event._id,
        });
        createdAlert = true;
        emitVesselEvent(io, "alert:new", alert, vessel._id);
    }

    let incident = null;
    let createdIncident = false;
    if (severity === "CRITICAL") {
        incident = await Incident.findOne({
            vessel: vessel._id,
            type: "GPS_SPOOFING",
            status: { $nin: ["RESOLVED", "CLOSED"] },
        });
        if (!incident) {
            incident = await Incident.create({
                incidentId: `GTI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                vessel: vessel._id,
                alert: alert._id,
                type: "GPS_SPOOFING",
                severity,
                title: "High-confidence GPS spoofing investigation",
                description: `${analysis.explanation.whatHappened} ${analysis.explanation.whatCausedIt}`,
                priority: "URGENT",
                source: telemetry.motion ? "ESP32" : "AI_ENGINE",
                confidence,
            });
            createdIncident = true;
            emitVesselEvent(io, "incident:new", incident, vessel._id);
        }
    }

    event.alert = alert?._id || null;
    event.incident = incident?._id || null;
    await event.save();
    if (incident && createdIncident) {
        appendIncidentEventSafely({
            incident: incident._id,
            vessel: vessel._id,
            eventType: "DETECTION",
            title: "GhostTrace confirmed GPS spoofing",
            description: analysis.explanation.whatCausedIt,
            source: "GHOSTTRACE",
            severity,
            occurredAt: event.createdAt,
            data: { detectionEvent: event._id, confidence, alertType: analysis.alertType },
        });
        if (createdAlert) appendIncidentEventSafely({
            incident: incident._id,
            vessel: vessel._id,
            eventType: "ALERT_CREATED",
            title: alert.title,
            description: alert.message,
            source: alert.source,
            severity,
            occurredAt: alert.detectedAt,
            data: { alert: alert._id, alertId: alert.alertId },
        });
        appendIncidentEventSafely({
            incident: incident._id,
            vessel: vessel._id,
            eventType: "INCIDENT_CREATED",
            title: incident.title,
            description: incident.description,
            source: incident.source,
            severity,
            occurredAt: incident.detectedAt,
            data: { incidentId: incident.incidentId },
        });
    }
    const simulationSession = await SimulationSession.findOneAndUpdate(
        { vessel: vessel._id },
        { $set: { hardware: { greenLed: false, redLed: true, buzzer: true } } },
        { new: true }
    ).populate("vessel", "name vesselId status riskScore riskLevel route destination");
    if (simulationSession) emitVesselEvent(io, "simulation:update", simulationSession, vessel._id);
    await Vessel.updateOne({ _id: vessel._id }, {
        $max: { riskScore: confidence },
        $set: { riskLevel: severity === "CRITICAL" ? "CRITICAL" : severity },
    });
    const navigationAction = await proposeNavigationAction({ vessel, telemetry, event, alert, incident });
    if (navigationAction) {
        event.navigationAction = navigationAction._id;
        await event.save();
        emitVesselEvent(io, "navigation-action:update", navigationAction, vessel._id);
    }
    writeAuditLog({
        actorRole: "GHOSTTRACE_ENGINE",
        vessel: vessel._id,
        action: "GPS_SPOOFING_DETECTED",
        resource: "GHOSTTRACE_EVENT",
        resourceId: String(event._id),
        description: analysis.explanation.whatCausedIt,
        metadata: { confidence, severity, alertId: alert?.alertId },
    }).catch((error) => console.error("GhostTrace audit error:", error.message));
    return { event, alert, incident, navigationAction };
};

module.exports = { haversineMeters, analyzeGhostTrace, processGhostTraceDetection };
