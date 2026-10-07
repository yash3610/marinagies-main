const mongoose = require("mongoose");

const simulationSessionSchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, unique: true },
    status: { type: String, enum: ["IDLE", "RUNNING", "PAUSED", "COMPLETED"], default: "IDLE" },
    actual: {
        latitude: { type: Number, min: -90, max: 90, required: true },
        longitude: { type: Number, min: -180, max: 180, required: true },
        speed: { type: Number, min: 0, max: 100, default: 10 },
        heading: { type: Number, min: 0, max: 360, default: 90 },
    },
    route: {
        origin: {
            name: { type: String, trim: true, default: "Current position" },
            latitude: { type: Number, min: -90, max: 90 },
            longitude: { type: Number, min: -180, max: 180 },
        },
        destination: {
            name: { type: String, trim: true, default: "Dubai" },
            latitude: { type: Number, min: -90, max: 90, default: 25.276987 },
            longitude: { type: Number, min: -180, max: 180, default: 55.296249 },
        },
        waypoints: [{
            name: { type: String, trim: true },
            latitude: { type: Number, min: -90, max: 90, required: true },
            longitude: { type: Number, min: -180, max: 180, required: true },
        }],
        waypointIndex: { type: Number, min: 0, default: 0 },
        distanceNm: { type: Number, min: 0, default: 0 },
        planner: { type: String, default: "" },
    },
    attack: {
        type: { type: String, enum: ["NONE", "GPS_SPOOFING"], default: "NONE" },
        active: { type: Boolean, default: false },
        offsetLatitude: { type: Number, default: 0 },
        offsetLongitude: { type: Number, default: 0 },
        injectedAt: { type: Date, default: null },
    },
    hardware: {
        greenLed: { type: Boolean, default: true },
        redLed: { type: Boolean, default: false },
        buzzer: { type: Boolean, default: false },
    },
    navigationSource: { type: String, enum: ["GPS", "TRUSTED_POSITION"], default: "GPS" },
    safeMode: {
        active: { type: Boolean, default: false },
        enteredAt: { type: Date, default: null },
        enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        reason: { type: String, trim: true, default: "" },
    },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    startedAt: { type: Date, default: null },
    stoppedAt: { type: Date, default: null },
    lastTickAt: { type: Date, default: null },
}, { timestamps: true });

simulationSessionSchema.index({ status: 1 });

module.exports = mongoose.model("SimulationSession", simulationSessionSchema);
