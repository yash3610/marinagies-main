const IncidentTimelineEvent = require("../models/IncidentTimelineEvent");

const appendIncidentEvent = async ({
    incident,
    vessel,
    eventType,
    title,
    description = "",
    source = "SYSTEM",
    actor = null,
    actorRole = null,
    severity = null,
    occurredAt = new Date(),
    data = {},
}) => IncidentTimelineEvent.create({
    incident,
    vessel,
    eventType,
    title,
    description,
    source,
    actor,
    actorRole,
    severity,
    occurredAt,
    data,
});

const appendIncidentEventSafely = (event) => appendIncidentEvent(event)
    .catch((error) => console.error("Incident timeline error:", error.message));

const listIncidentEvents = (incidentId) => IncidentTimelineEvent.find({ incident: incidentId })
    .populate("actor", "name email role")
    .sort({ occurredAt: 1, createdAt: 1 })
    .lean();

module.exports = { appendIncidentEvent, appendIncidentEventSafely, listIncidentEvents };
