const Incident = require("../models/Incident");
const Alert = require("../models/Alert");
const GhostTraceEvent = require("../models/GhostTraceEvent");
const NavigationAction = require("../models/NavigationAction");
const Telemetry = require("../models/Telemetry");
const AuditLog = require("../models/AuditLog");
const { listIncidentEvents } = require("./incidentTimeline.service");
const { createTextPdf } = require("./pdf.service");

const inferredTimeline = ({ incident, alert, detection, action }) => {
    const events = [{
        eventType: "INCIDENT_CREATED",
        title: "Incident created",
        description: incident.description,
        source: incident.source,
        severity: incident.severity,
        occurredAt: incident.detectedAt || incident.createdAt,
        data: { inferred: true },
    }];
    if (alert) events.push({
        eventType: "ALERT_CREATED", title: alert.title, description: alert.message,
        source: alert.source, severity: alert.severity, occurredAt: alert.detectedAt || alert.createdAt,
        data: { alertId: alert.alertId, inferred: true },
    });
    if (detection) events.push({
        eventType: "DETECTION", title: "GhostTrace detection", description: detection.explanation?.whatCausedIt,
        source: "GHOSTTRACE", severity: incident.severity, occurredAt: detection.createdAt,
        data: { confidenceScore: detection.confidenceScore, alertType: detection.alertType, inferred: true },
    });
    if (action) events.push({
        eventType: "DIGITAL_TWIN_RESULT", title: `Digital Twin: ${action.digitalTwin?.result}`,
        description: action.digitalTwin?.summary, source: "DIGITAL_TWIN", occurredAt: action.digitalTwin?.simulatedAt || action.createdAt,
        data: { actionId: action.actionId, status: action.status, inferred: true },
    });
    return events.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
};

const buildIncidentReport = async (incidentId) => {
    const incident = await Incident.findById(incidentId)
        .populate("vessel", "name vesselId imo mmsi status riskScore riskLevel")
        .populate("assignedTo", "name email role")
        .lean();
    if (!incident) return null;

    const [alert, detection, action, storedTimeline] = await Promise.all([
        incident.alert ? Alert.findById(incident.alert).lean() : null,
        GhostTraceEvent.findOne({ incident: incident._id }).sort({ createdAt: -1 }).lean(),
        NavigationAction.findOne({ incident: incident._id }).populate("decision.decidedBy", "name email role").sort({ createdAt: -1 }).lean(),
        listIncidentEvents(incident._id),
    ]);
    const start = new Date(new Date(incident.detectedAt || incident.createdAt).getTime() - 5 * 60 * 1000);
    const endBase = incident.closedAt || incident.resolvedAt || new Date();
    const end = new Date(Math.min(new Date(endBase).getTime() + 5 * 60 * 1000, start.getTime() + 24 * 60 * 60 * 1000));
    const vesselId = incident.vessel?._id || incident.vessel;
    const [telemetry, audit] = await Promise.all([
        Telemetry.find({ vessel: vesselId, timestamp: { $gte: start, $lte: end } })
            .sort({ timestamp: 1 }).limit(500).lean(),
        AuditLog.find({ vessel: vesselId, createdAt: { $gte: start, $lte: end } })
            .populate("user", "name email role").sort({ createdAt: 1 }).limit(500).lean(),
    ]);
    const timeline = storedTimeline.length
        ? storedTimeline
        : inferredTimeline({ incident, alert, detection, action });
    return {
        schemaVersion: "1.0",
        generatedAt: new Date(),
        incident,
        alert,
        detection,
        navigationAction: action,
        timeline,
        telemetry,
        audit,
        evidenceSummary: {
            telemetrySamples: telemetry.length,
            auditEntries: audit.length,
            timelineEvents: timeline.length,
            confidence: incident.confidence,
            digitalTwinResult: action?.digitalTwin?.result || "NOT_AVAILABLE",
            operatorDecision: action?.status || "NOT_AVAILABLE",
        },
    };
};

const reportToPdf = (report) => {
    const { incident, alert, detection, navigationAction: action } = report;
    const lines = [
        `Generated: ${new Date(report.generatedAt).toISOString()}`,
        `Incident: ${incident.incidentId} | ${incident.title}`,
        `Vessel: ${incident.vessel?.name || "Unknown"} (${incident.vessel?.vesselId || "--"})`,
        `Type: ${incident.type} | Severity: ${incident.severity} | Status: ${incident.status}`,
        `Confidence: ${incident.confidence}% | Source: ${incident.source}`,
        `Description: ${incident.description}`,
        "",
        "Detection evidence",
        `Alert: ${alert?.alertId || "Not available"} | ${alert?.title || ""}`,
        `What happened: ${detection?.explanation?.whatHappened || "Not available"}`,
        `Cause: ${detection?.explanation?.whatCausedIt || "Not available"}`,
        `Why it matters: ${detection?.explanation?.whyItMatters || "Not available"}`,
        `Recommended action: ${detection?.explanation?.recommendedAction || "Not available"}`,
        "",
        "Response",
        `Digital Twin: ${action?.digitalTwin?.result || "Not available"} | Action: ${action?.status || "Not available"}`,
        `Simulation summary: ${action?.digitalTwin?.summary || "Not available"}`,
        `Operator note: ${action?.decision?.note || "Not available"}`,
        "",
        `Evidence totals: ${report.telemetry.length} telemetry samples, ${report.audit.length} audit entries`,
        "",
        "Incident timeline",
        ...report.timeline.map((event) => `${new Date(event.occurredAt).toISOString()} | ${event.eventType} | ${event.title} | ${event.description || ""}`),
    ];
    return createTextPdf(`MarineAegis Security Incident Report - ${incident.incidentId}`, lines);
};

module.exports = { inferredTimeline, buildIncidentReport, reportToPdf };
