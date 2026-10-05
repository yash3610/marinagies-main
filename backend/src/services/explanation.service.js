const { normalizeRole } = require("../utils/accessControl");

const ROLE_ACTIONS = Object.freeze({
    BRIDGE_CREW: {
        GHOSTTRACE: "Cross-check radar, visual position, AIS, gyrocompass and the independent motion node before changing course.",
        SARVERIFY: "Verify the distress position and identity through an independent bridge channel before changing route.",
        default: "Acknowledge the alert, verify onboard conditions and follow the approved bridge checklist.",
    },
    NETWORK_SECURITY: {
        EDGEARMOR: "Inspect device identity, firmware and heartbeat evidence; quarantine the node if the anomaly remains unexplained.",
        NETGUARD: "Inspect the source device and DNS/network evidence; retain the block unless investigation confirms a false positive.",
        AGENTWATCH: "Review the event sequence and source identity, preserve evidence and contain the source if corroborated.",
        default: "Correlate the evidence with other modules, preserve telemetry and contain the affected source when justified.",
    },
    ROC_OPERATOR: {
        ROCSHIELD: "Keep the command held or blocked until a supervisor verifies the operator, context and command through MFA.",
        default: "Verify operational context and complete the required human authorization before executing a remote action.",
    },
    FLEET_MANAGER: {
        FLEETCHOKE: "Review affected vessels and supplier dependencies, then prioritize remediation by fleet blast radius.",
        default: "Review fleet exposure, assign an owner and monitor related vessels for the same evidence pattern.",
    },
    COMPLIANCE_AUDITOR: {
        default: "Review the immutable evidence, operator decisions and audit-chain entry; record any control exception.",
    },
    ADMIN: {
        default: "Coordinate the responsible operational role, preserve evidence and verify that the response is audited.",
    },
});

const TYPE_IMPACT = Object.freeze({
    GPS_SPOOFING: "False navigation data can move the displayed vessel position away from its real physical movement.",
    AIS_ANOMALY: "Untrusted AIS data can produce an incorrect traffic or collision-avoidance picture.",
    ROUTE_DEVIATION: "An unexplained route deviation can create navigation and mission risk.",
    NAVIGATION_ANOMALY: "Conflicting navigation sources can lead to an unsafe course decision.",
    CYBER_ATTACK: "Correlated hostile activity can affect vessel availability, integrity or operational safety.",
    UNAUTHORIZED_ACCESS: "An unauthorized action can bypass operational command authority.",
    DEVICE_FAILURE: "A failed or compromised edge device can corrupt telemetry and downstream security decisions.",
    SYSTEM_ANOMALY: "An unexplained system condition can reduce confidence in automated protection.",
});

const humanize = (value) => String(value || "unknown").replaceAll("_", " ").toLowerCase();
const roleActionsFor = (module) => Object.fromEntries(
    Object.entries(ROLE_ACTIONS).map(([role, actions]) => [role, actions[module] || actions.default])
);

const findMlInference = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 5) return null;
    if (value.modelKey && value.version != null && value.probability != null) return value;
    for (const child of Object.values(value)) {
        const found = findMlInference(child, depth + 1);
        if (found) return found;
    }
    return null;
};

const scalarEvidence = (evidence, prefix = "", depth = 0) => {
    if (!evidence || typeof evidence !== "object" || depth > 2) return [];
    const rows = [];
    for (const [key, value] of Object.entries(evidence)) {
        const label = prefix ? `${prefix}.${key}` : key;
        if (["string", "number", "boolean"].includes(typeof value)) rows.push(`${label}: ${value}`);
        else if (Array.isArray(value) && value.length && value.length <= 8) rows.push(`${label}: ${value.join(", ")}`);
        else if (value && typeof value === "object") rows.push(...scalarEvidence(value, label, depth + 1));
        if (rows.length >= 8) break;
    }
    return rows.slice(0, 8);
};

const ensureExplanation = (alert) => {
    const supplied = alert.explanation && typeof alert.explanation === "object" ? { ...alert.explanation } : {};
    const module = String(alert.module || "SYSTEM").toUpperCase();
    const confidence = Number(alert.confidence || 0);
    const evidenceSummary = scalarEvidence(alert.evidence);
    const ml = alert.source === "MANUAL" ? null : findMlInference(alert.evidence);
    const model = ml ? {
        used: true, engine: ml.engine || "ML_MODEL", modelKey: ml.modelKey,
        version: ml.version, algorithm: ml.algorithm || "",
        probability: Math.round(Number(ml.probability) * 1000) / 10,
        componentScores: ml.componentScores || {}, artifactHash: ml.artifactHash || "",
    } : { used: false, engine: "DETERMINISTIC_RULES" };

    return {
        whatHappened: supplied.whatHappened || `${module} detected ${humanize(alert.type)} with ${confidence}% confidence.`,
        whyItMatters: supplied.whyItMatters || TYPE_IMPACT[alert.type] || "This condition requires operator verification before it affects vessel operations.",
        whatCausedIt: supplied.whatCausedIt || evidenceSummary.join("; ") || alert.message || "The module evidence crossed its configured detection threshold.",
        recommendedAction: supplied.recommendedAction || roleActionsFor(module).ADMIN,
        recommendedActions: roleActionsFor(module),
        evidenceSummary: supplied.evidenceSummary?.length ? supplied.evidenceSummary : evidenceSummary,
        decisionSupport: model,
        generatedAt: supplied.generatedAt || new Date(),
    };
};

const presentAlertForRole = (alert, role, userId) => {
    const result = alert?.toObject ? alert.toObject() : { ...alert };
    const explanation = ensureExplanation(result);
    const normalized = normalizeRole(role);
    explanation.recommendedAction = explanation.recommendedActions?.[normalized]
        || explanation.recommendedActions?.ADMIN || explanation.recommendedAction;
    const feedback = result.explanationFeedback || [];
    result.explanation = explanation;
    result.explanationFeedbackSummary = {
        helpful: feedback.filter((item) => item.helpful === true).length,
        notHelpful: feedback.filter((item) => item.helpful === false).length,
        userVote: feedback.find((item) => String(item.user) === String(userId))?.helpful ?? null,
    };
    delete result.explanationFeedback;
    return result;
};

module.exports = { ensureExplanation, presentAlertForRole, roleActionsFor, findMlInference, scalarEvidence };
