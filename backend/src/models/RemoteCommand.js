const mongoose = require("mongoose");

const factorSchema = new mongoose.Schema({
    score: { type: Number, required: true, min: 0, max: 1 },
    weight: { type: Number, required: true, min: 0, max: 1 },
    reasons: [{ type: String, trim: true }],
}, { _id: false });

const remoteCommandSchema = new mongoose.Schema({
    commandId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    nonce: { type: String, required: true, unique: true, trim: true, minlength: 12, maxlength: 128 },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    operatorRole: { type: String, required: true, trim: true },
    type: { type: String, enum: ["SET_HEADING", "SET_SPEED", "CHANGE_ROUTE", "STOP_ENGINE", "EMERGENCY_STOP", "RETURN_TO_PORT", "ENTER_SAFE_MODE"], required: true },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    issuedAt: { type: Date, required: true },
    interceptedAt: { type: Date, required: true, default: Date.now },
    offlineMode: { type: Boolean, default: true },
    contextSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    riskFactors: {
        routeDeviation: { type: factorSchema, required: true },
        operatorPattern: { type: factorSchema, required: true },
        environmentalContext: { type: factorSchema, required: true },
        timeAnomaly: { type: factorSchema, required: true },
        sequenceAnomaly: { type: factorSchema, required: true },
        authorityCheck: { type: factorSchema, required: true },
    },
    riskScore: { type: Number, required: true, min: 0, max: 1, index: true },
    riskPercent: { type: Number, required: true, min: 0, max: 100 },
    decision: { type: String, enum: ["AUTO_EXECUTE", "HOLD", "BLOCK"], required: true, index: true },
    status: { type: String, enum: ["INTERCEPTED", "EXECUTED", "PENDING_APPROVAL", "BLOCKED", "REJECTED", "FAILED", "ACKNOWLEDGED"], required: true, index: true },
    explanation: { type: mongoose.Schema.Types.Mixed, required: true },
    requiresMfa: { type: Boolean, default: false },
    outcome: { type: String, default: "", trim: true, maxlength: 1000 },
    execution: { executedAt: { type: Date, default: null }, appliedChanges: { type: mongoose.Schema.Types.Mixed, default: {} } },
    review: { reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, reviewedAt: { type: Date, default: null }, decision: { type: String, enum: ["APPROVE", "REJECT", "ACKNOWLEDGE", null], default: null }, note: { type: String, trim: true, maxlength: 500, default: "" }, mfaVerified: { type: Boolean, default: false } },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", default: null },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
    processingTimeMs: { type: Number, required: true, min: 0 },
    simulated: { type: Boolean, default: false },
}, { timestamps: true });

remoteCommandSchema.index({ vessel: 1, interceptedAt: -1 });
remoteCommandSchema.index({ operator: 1, interceptedAt: -1 });
module.exports = mongoose.model("RemoteCommand", remoteCommandSchema);
