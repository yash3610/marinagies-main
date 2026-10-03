const mongoose = require("mongoose");
const Telemetry = require("../models/Telemetry");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");

const SOURCES = new Set(["SENSOR_AGENT", "NMEA", "AIS", "MANUAL", "SIMULATOR", "API"]);
const AIS_STATUSES = new Set(["ACTIVE", "INACTIVE", "ANOMALY"]);
const DEVICE_STATUSES = new Set(["ONLINE", "OFFLINE", "WARNING"]);
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

const finiteNumber = (value, field, { min = -Infinity, max = Infinity, fallback } = {}) => {
    if ((value === undefined || value === null || value === "") && fallback !== undefined) return fallback;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw Object.assign(new Error(`${field} must be a number between ${min} and ${max}`), { status: 400 });
    }
    return number;
};

const enumValue = (value, field, allowed, fallback) => {
    const normalized = String(value || fallback).toUpperCase();
    if (!allowed.has(normalized)) {
        throw Object.assign(new Error(`${field} has an invalid value`), { status: 400 });
    }
    return normalized;
};

const optionalNumber = (value, field, bounds) =>
    value === undefined || value === null || value === ""
        ? undefined
        : finiteNumber(value, field, bounds);

const compactObject = (value) => {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
};

const optionalBoolean = (value, field) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === true || value === false) return value;
    if (value === 1 || value === "1" || String(value).toLowerCase() === "true") return true;
    if (value === 0 || value === "0" || String(value).toLowerCase() === "false") return false;
    throw Object.assign(new Error(`${field} must be a boolean`), { status: 400 });
};

const normalizeMotion = (input) => {
    const raw = input.motion || input.mpu6050;
    if (!raw) return undefined;
    const accelerometer = raw.accelerometer || raw.accel || {};
    const gyroscope = raw.gyroscope || raw.gyro || {};
    const normalized = compactObject({
        accelerometer: compactObject({
            x: optionalNumber(accelerometer.x, "motion.accelerometer.x", { min: -16, max: 16 }),
            y: optionalNumber(accelerometer.y, "motion.accelerometer.y", { min: -16, max: 16 }),
            z: optionalNumber(accelerometer.z, "motion.accelerometer.z", { min: -16, max: 16 }),
        }),
        gyroscope: compactObject({
            x: optionalNumber(gyroscope.x, "motion.gyroscope.x", { min: -2000, max: 2000 }),
            y: optionalNumber(gyroscope.y, "motion.gyroscope.y", { min: -2000, max: 2000 }),
            z: optionalNumber(gyroscope.z, "motion.gyroscope.z", { min: -2000, max: 2000 }),
        }),
        temperature: optionalNumber(raw.temperature, "motion.temperature", { min: -40, max: 125 }),
        motionDetected: optionalBoolean(raw.motionDetected, "motion.motionDetected"),
    });
    if (!normalized) throw Object.assign(new Error("motion must contain MPU6050 sensor values"), { status: 400 });
    return normalized;
};

const normalizeNavigationReference = (input) => {
    const raw = input.navigationReference || {};
    return compactObject({
        aisLatitude: optionalNumber(raw.aisLatitude ?? input.aisLatitude, "navigationReference.aisLatitude", { min: -90, max: 90 }),
        aisLongitude: optionalNumber(raw.aisLongitude ?? input.aisLongitude, "navigationReference.aisLongitude", { min: -180, max: 180 }),
        gyroHeading: optionalNumber(raw.gyroHeading ?? input.gyroHeading, "navigationReference.gyroHeading", { min: 0, max: 360 }),
        simulatedSpeed: optionalNumber(raw.simulatedSpeed ?? input.simulatedSpeed, "navigationReference.simulatedSpeed", { min: 0, max: 100 }),
    });
};

const normalizeTelemetrySample = (input = {}, now = new Date()) => {
    if (!input.vessel || !mongoose.isValidObjectId(input.vessel)) {
        throw Object.assign(new Error("A valid vessel id is required"), { status: 400 });
    }

    const timestamp = input.timestamp ? new Date(input.timestamp) : new Date(now);
    if (Number.isNaN(timestamp.getTime())) {
        throw Object.assign(new Error("timestamp must be a valid date"), { status: 400 });
    }
    if (timestamp.getTime() > now.getTime() + MAX_FUTURE_SKEW_MS) {
        throw Object.assign(new Error("timestamp cannot be more than 5 minutes in the future"), { status: 400 });
    }

    const eventId = input.eventId === undefined ? undefined : String(input.eventId).trim();
    if (eventId !== undefined && (!eventId || eventId.length > 128)) {
        throw Object.assign(new Error("eventId must contain 1 to 128 characters"), { status: 400 });
    }

    const deviceId = input.sensorNode?.deviceId ?? input.deviceId;
    const firmwareVersion = input.sensorNode?.firmwareVersion ?? input.firmwareVersion;
    const motion = normalizeMotion(input);
    const navigationReference = normalizeNavigationReference(input);
    if (deviceId !== undefined && (!String(deviceId).trim() || String(deviceId).length > 100)) {
        throw Object.assign(new Error("sensorNode.deviceId must contain 1 to 100 characters"), { status: 400 });
    }

    return {
        vessel: String(input.vessel),
        ...(eventId ? { eventId } : {}),
        source: enumValue(input.source, "source", SOURCES, "API"),
        ...(deviceId !== undefined || firmwareVersion !== undefined ? {
            sensorNode: compactObject({
                deviceId: deviceId === undefined ? undefined : String(deviceId).trim(),
                firmwareVersion: firmwareVersion === undefined ? undefined : String(firmwareVersion).trim().slice(0, 50),
            }),
        } : {}),
        ...(motion ? { motion } : {}),
        ...(navigationReference ? { navigationReference } : {}),
        timestamp,
        speed: finiteNumber(input.speed, "speed", { min: 0, max: 100, fallback: 0 }),
        heading: finiteNumber(input.heading, "heading", { min: 0, max: 360, fallback: 0 }),
        latitude: finiteNumber(input.latitude, "latitude", { min: -90, max: 90 }),
        longitude: finiteNumber(input.longitude, "longitude", { min: -180, max: 180 }),
        depth: finiteNumber(input.depth, "depth", { min: 0, max: 15000, fallback: 0 }),
        gpsSignal: finiteNumber(input.gpsSignal, "gpsSignal", { min: 0, max: 100, fallback: 0 }),
        aisStatus: enumValue(input.aisStatus, "aisStatus", AIS_STATUSES, "ACTIVE"),
        deviceStatus: enumValue(input.deviceStatus, "deviceStatus", DEVICE_STATUSES, "ONLINE"),
        engineTemperature: finiteNumber(input.engineTemperature, "engineTemperature", { min: -100, max: 300, fallback: 0 }),
        fuelLevel: finiteNumber(input.fuelLevel, "fuelLevel", { min: 0, max: 100, fallback: 0 }),
    };
};

const stateFields = (telemetry) => ({
    telemetry: telemetry._id,
    ...(telemetry.eventId ? { eventId: telemetry.eventId } : { $unset: { eventId: 1 } }),
    source: telemetry.source,
    sourceTimestamp: telemetry.timestamp,
    receivedAt: telemetry.receivedAt,
    speed: telemetry.speed,
    heading: telemetry.heading,
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    depth: telemetry.depth,
    gpsSignal: telemetry.gpsSignal,
    aisStatus: telemetry.aisStatus,
    deviceStatus: telemetry.deviceStatus,
    engineTemperature: telemetry.engineTemperature,
    fuelLevel: telemetry.fuelLevel,
    ...(telemetry.sensorNode ? { sensorNode: telemetry.sensorNode } : {}),
    ...(telemetry.motion ? { motion: telemetry.motion } : {}),
    ...(telemetry.navigationReference ? { navigationReference: telemetry.navigationReference } : {}),
});

const writeCurrentState = async (telemetry) => {
    const fields = stateFields(telemetry);
    const unset = fields.$unset;
    delete fields.$unset;
    let current = await VesselCurrentState.findOneAndUpdate(
        {
            vessel: telemetry.vessel,
            $or: [
                { sourceTimestamp: { $lte: telemetry.timestamp } },
                { sourceTimestamp: { $exists: false } },
            ],
        },
        { $set: fields, ...(unset ? { $unset: unset } : {}) },
        { new: true, runValidators: true }
    );

    if (!current) {
        try {
            current = await VesselCurrentState.create({ vessel: telemetry.vessel, ...fields });
        } catch (error) {
            if (error?.code !== 11000) throw error;
            current = await VesselCurrentState.findOne({ vessel: telemetry.vessel });
        }
    }

    const isLatest = String(current?.telemetry) === String(telemetry._id);
    if (isLatest) {
        await Vessel.updateOne(
            { _id: telemetry.vessel },
            {
                $set: {
                    latitude: telemetry.latitude,
                    longitude: telemetry.longitude,
                    speed: telemetry.speed,
                    heading: telemetry.heading,
                    status: telemetry.deviceStatus,
                    lastSeen: telemetry.timestamp,
                },
            }
        );
    }
    return { current, isLatest };
};

const ingestTelemetry = async (input) => {
    const sample = normalizeTelemetrySample(input);
    const vessel = await Vessel.findOne({ _id: sample.vessel, isActive: true }).select("_id name vesselId");
    if (!vessel) throw Object.assign(new Error("Vessel not found or inactive"), { status: 404 });

    if (sample.eventId) {
        const duplicate = await Telemetry.findOne({ eventId: sample.eventId });
        if (duplicate) return { telemetry: duplicate, vessel, duplicate: true, isLatest: false };
    }

    const previousState = await VesselCurrentState.findOne({ vessel: sample.vessel }).lean();
    let telemetry;
    try {
        telemetry = await Telemetry.create({ ...sample, receivedAt: new Date() });
    } catch (error) {
        if (error?.code !== 11000 || !sample.eventId) throw error;
        telemetry = await Telemetry.findOne({ eventId: sample.eventId });
        return { telemetry, vessel, duplicate: true, isLatest: false };
    }

    const { current, isLatest } = await writeCurrentState(telemetry);
    return { telemetry, current, previousState, vessel, duplicate: false, isLatest };
};

module.exports = { normalizeTelemetrySample, ingestTelemetry, MAX_FUTURE_SKEW_MS };
