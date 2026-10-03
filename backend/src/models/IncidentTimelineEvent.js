const mongoose = require("mongoose");

const incidentTimelineEventSchema = new mongoose.Schema({
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true, index: true },
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    eventType: {
        type: String,
        required: true,
        enum: [
            "INCIDENT_CREATED",
            "DETECTION",
            "ALERT_CREATED",
            "DIGITAL_TWIN_RESULT",
            "ACTION_APPROVED",
            "ACTION_REJECTED",
            "SAFE_MODE_ENTERED",
            "SAFE_MODE_EXITED",
            "STATUS_CHANGED",
            "NOTE",
        ],
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    source: { type: String, default: "SYSTEM", trim: true, maxlength: 80 },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, default: null, trim: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL", null], default: null },
    occurredAt: { type: Date, required: true, default: Date.now },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

incidentTimelineEventSchema.index({ incident: 1, occurredAt: 1, createdAt: 1 });
incidentTimelineEventSchema.index({ vessel: 1, occurredAt: -1 });

module.exports = mongoose.model("IncidentTimelineEvent", incidentTimelineEventSchema);
