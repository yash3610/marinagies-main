const crypto = require("node:crypto");
const { isIP } = require("node:net");
const AgentWatchEvent = require("../models/AgentWatchEvent");
const AttackSequence = require("../models/AttackSequence");
const NetworkPolicy = require("../models/NetworkPolicy");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const Vessel = require("../models/Vessel");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");
const { appendIncidentEventSafely } = require("./incidentTimeline.service");
const { inferActiveModel } = require("./mlRuntime.service");
const { runtimeFeatures } = require("./mlTraining.service");

const STAGE_ORDER = ["RECON", "CREDENTIAL_ATTACK", "LATERAL_MOVEMENT", "EXFILTRATION"];
const KIND_TO_STAGE = {
    NETWORK_SCAN: "RECON",
    AUTH_FAILURE: "CREDENTIAL_ATTACK",
    AUTH_SUCCESS: "CREDENTIAL_ATTACK",
    PRIVILEGE_ESCALATION: "LATERAL_MOVEMENT",
    NETWORK_CONNECTION: "LATERAL_MOVEMENT",
    COMMAND_EXECUTION: "LATERAL_MOVEMENT",
    DATA_ACCESS: "EXFILTRATION",
    EXFILTRATION: "EXFILTRATION",
};
const MITRE_MAP = {
    NETWORK_SCAN: ["T1046", "Network Service Discovery"],
    AUTH_FAILURE: ["T1110", "Brute Force"],
    AUTH_SUCCESS: ["T1078", "Valid Accounts"],
    PRIVILEGE_ESCALATION: ["T1068", "Exploitation for Privilege Escalation"],
    NETWORK_CONNECTION: ["T1021", "Remote Services / Lateral Movement"],
    COMMAND_EXECUTION: ["T1059", "Command and Scripting Interpreter"],
    DATA_ACCESS: ["T1005", "Data from Local System"],
    EXFILTRATION: ["T1041", "Exfiltration Over C2 Channel"],
};

const median = (values) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const analyzeAttackSequence = (inputEvents) => {
    const events = [...inputEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (!events.length) return null;
    const startAt = new Date(events[0].timestamp);
    const endAt = new Date(events.at(-1).timestamp);
    const intervals = events.slice(1).map((event, index) => new Date(event.timestamp) - new Date(events[index].timestamp));
    const medianIntervalMs = median(intervals);
    const stages = [...new Set(events.map((event) => event.stage))];
    const orderedStages = STAGE_ORDER.filter((stage) => stages.includes(stage));
    const complete = orderedStages.length === STAGE_ORDER.length;
    const timingScore = medianIntervalMs > 0 && medianIntervalMs < 2000 ? 100
        : medianIntervalMs < 10000 ? 70 : medianIntervalMs < 45000 ? 35 : 10;
    const completenessScore = Math.round(orderedStages.length / STAGE_ORDER.length * 100);
    const eventDiversity = new Set(events.map((event) => event.eventKind)).size;
    const signatureScore = Math.min(100, Math.round(eventDiversity / 6 * 100));
    let confidence = Math.round(timingScore * 0.45 + completenessScore * 0.35 + signatureScore * 0.20);
    if (!complete) confidence = Math.min(confidence, 69);
    const confidenceLevel = confidence >= 80 ? "HIGH" : confidence >= 55 ? "MEDIUM" : "LOW";
    const classification = complete && confidence >= 70 ? "AUTONOMOUS_SUSPECTED"
        : complete && medianIntervalMs >= 45000 ? "HUMAN_PACED" : "INCOMPLETE";
    const mitreTechniques = [...new Map(events.map((event) => {
        const [techniqueId, name] = MITRE_MAP[event.eventKind] || ["T0000", "Unmapped maritime event"];
        return [techniqueId, { techniqueId, name, stage: event.stage }];
    })).values()];
    const durationMs = Math.max(0, endAt - startAt);
    return {
        events, stages: orderedStages, startAt, endAt, durationMs, medianIntervalMs,
        confidence, confidenceLevel, classification, mitreTechniques,
        explanation: {
            whatHappened: `${events.length} security events progressed through ${orderedStages.join(" -> ")} in ${(durationMs / 1000).toFixed(1)} seconds.`,
            whyItMatters: complete
                ? "A complete attack lifecycle executed at a speed that is difficult for a human operator to sustain."
                : "The activity contains part of a known attack progression and requires continued monitoring.",
            whatCausedIt: `Median time between events was ${(medianIntervalMs / 1000).toFixed(2)} seconds; ${eventDiversity} event types matched ${mitreTechniques.length} MITRE techniques.`,
            recommendedAction: confidence >= 80
                ? "Keep the source isolated, validate affected accounts and inspect the target systems."
                : "Review the timeline and isolate the source if additional attack stages appear.",
        },
    };
};

const isolateSource = async ({ vesselId, sourceIp, sequence }) => {
    const policy = await NetworkPolicy.findOneAndUpdate(
        { vessel: vesselId }, { $setOnInsert: { vessel: vesselId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const existing = policy.isolatedSources.find((item) => item.sourceIp === sourceIp && item.active);
    if (!existing) {
        policy.isolatedSources.push({
            sourceIp, reason: `AgentWatch HIGH-confidence sequence ${sequence.sequenceId}`,
            sequence: sequence._id, isolatedAt: new Date(), active: true,
        });
        policy.policyVersion += 1;
        await policy.save();
    }
    return policy;
};

const createSequenceResponse = async ({ analysis, vessel, sourceIp, sourceDevice, io }) => {
    if (analysis.classification !== "AUTONOMOUS_SUSPECTED") return null;
    const recent = await AttackSequence.findOne({ vessel: vessel._id, sourceIp, startAt: { $gte: new Date(Date.now() - 60 * 1000) } });
    if (recent) return recent;
    const eventIds = analysis.events.map((event) => String(event._id));
    const fingerprint = crypto.createHash("sha256").update(eventIds.join(":"), "utf8").digest("hex");
    const sequence = await AttackSequence.create({
        sequenceId: `AW-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        fingerprint, vessel: vessel._id, sourceIp, sourceDevice,
        events: analysis.events.map((event) => event._id), stages: analysis.stages,
        startAt: analysis.startAt, endAt: analysis.endAt, durationMs: analysis.durationMs,
        medianIntervalMs: analysis.medianIntervalMs, confidence: analysis.confidence,
        confidenceLevel: analysis.confidenceLevel, classification: analysis.classification,
        mlInference: analysis.mlInference || null,
        mitreTechniques: analysis.mitreTechniques, explanation: analysis.explanation,
    });
    if (analysis.confidenceLevel === "HIGH") {
        const policy = await isolateSource({ vesselId: vessel._id, sourceIp, sequence });
        sequence.isolated = true;
        sequence.isolatedAt = new Date();
        emitVesselEvent(io, "netguard:policy", policy, vessel._id);
    }
    const severity = analysis.confidence >= 90 ? "CRITICAL" : "HIGH";
    const alert = await Alert.create({
        alertId: `AW-ALERT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        vessel: vessel._id, type: "CYBER_ATTACK", severity,
        title: "AgentWatch: Machine-speed attack sequence detected",
        message: analysis.explanation.whatCausedIt, source: "AI_ENGINE",
        confidence: analysis.confidence, confidenceLevel: analysis.confidenceLevel,
        module: "AGENTWATCH", explanation: analysis.explanation,
        evidence: { sequence: sequence._id, sequenceId: sequence.sequenceId, sourceIp, stages: analysis.stages, mitreTechniques: analysis.mitreTechniques },
    });
    sequence.alert = alert._id;
    if (analysis.confidenceLevel === "HIGH") {
        const incident = await Incident.create({
            incidentId: `AWI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            vessel: vessel._id, alert: alert._id, type: "CYBER_ATTACK", severity,
            title: "Autonomous attack investigation",
            description: `${analysis.explanation.whatHappened} ${analysis.explanation.whatCausedIt}`,
            priority: "URGENT", source: "AI_ENGINE", confidence: analysis.confidence,
        });
        sequence.incident = incident._id;
        appendIncidentEventSafely({
            incident: incident._id, vessel: vessel._id, eventType: "DETECTION",
            title: "AgentWatch machine-speed sequence detected", description: analysis.explanation.whatHappened,
            source: "AGENTWATCH", severity, data: { sequence: sequence._id, sourceIp, mitreTechniques: analysis.mitreTechniques },
        });
        emitVesselEvent(io, "incident:new", incident, vessel._id);
    }
    await sequence.save();
    emitVesselEvent(io, "alert:new", alert, vessel._id);
    emitVesselEvent(io, "agentwatch:sequence", sequence, vessel._id);
    writeAuditLog({
        actorRole: "AGENTWATCH_ENGINE", vessel: vessel._id,
        action: sequence.isolated ? "AUTONOMOUS_ATTACK_SOURCE_ISOLATED" : "AUTONOMOUS_ATTACK_DETECTED",
        resource: "ATTACK_SEQUENCE", resourceId: String(sequence._id),
        description: analysis.explanation.whatCausedIt,
        metadata: { confidence: analysis.confidence, sourceIp, stages: analysis.stages, isolated: sequence.isolated },
    }).catch((error) => console.error("AgentWatch audit error:", error.message));
    return sequence;
};

const ingestAgentWatchEvent = async (input, io) => {
    const vessel = await Vessel.findOne({ _id: input.vessel, isActive: true }).select("_id name vesselId");
    if (!vessel) throw Object.assign(new Error("Vessel not found or inactive"), { status: 404 });
    const eventKind = String(input.eventKind || "").toUpperCase();
    if (!KIND_TO_STAGE[eventKind]) throw Object.assign(new Error("Unsupported AgentWatch event kind"), { status: 400 });
    const sourceIp = String(input.sourceIp || "").trim();
    if (!isIP(sourceIp)) throw Object.assign(new Error("A valid sourceIp is required"), { status: 400 });
    const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();
    if (Number.isNaN(timestamp.getTime()) || timestamp > new Date(Date.now() + 5 * 60 * 1000)) {
        throw Object.assign(new Error("timestamp must be valid and no more than 5 minutes in the future"), { status: 400 });
    }
    const eventId = String(input.eventId || `agentwatch:${vessel._id}:${Date.now()}:${crypto.randomUUID()}`).slice(0, 128);
    const duplicate = await AgentWatchEvent.findOne({ eventId });
    if (duplicate) return { event: duplicate, sequence: null, duplicate: true };
    const event = await AgentWatchEvent.create({
        eventId, vessel: vessel._id, sourceIp,
        sourceDevice: input.sourceDevice || "unknown", userAccount: input.userAccount || "",
        eventKind, stage: KIND_TO_STAGE[eventKind], target: input.target || "",
        details: input.details || {}, networkEvent: input.networkEvent || null,
        simulated: Boolean(input.simulated), timestamp,
    });
    const candidateEvents = await AgentWatchEvent.find({
        vessel: vessel._id, sourceIp, timestamp: { $gte: new Date(new Date(event.timestamp).getTime() - 30 * 60 * 1000), $lte: event.timestamp },
    }).sort({ timestamp: 1 }).limit(100).lean();
    const analysis = analyzeAttackSequence(candidateEvents);
    if (analysis) {
        const mlInference = await inferActiveModel("AGENTWATCH", runtimeFeatures.AGENTWATCH(analysis), vessel._id);
        if (mlInference) {
            analysis.mlInference = mlInference;
            analysis.confidence = Math.max(analysis.confidence, Math.round(mlInference.probability * 100));
            analysis.confidenceLevel = analysis.confidence >= 80 ? "HIGH" : analysis.confidence >= 55 ? "MEDIUM" : "LOW";
            if (mlInference.probability >= 0.7 && analysis.stages.length >= 3) analysis.classification = "AUTONOMOUS_SUSPECTED";
            analysis.explanation.whatCausedIt += ` Active ${mlInference.modelKey} v${mlInference.version} produced ${(mlInference.probability * 100).toFixed(1)}% autonomous-attack probability.`;
        }
    }
    const sequence = analysis && analysis.events.length >= 5
        ? await createSequenceResponse({ analysis, vessel, sourceIp, sourceDevice: event.sourceDevice, io })
        : null;
    const populated = await AgentWatchEvent.findById(event._id).populate("vessel", "name vesselId").lean();
    emitVesselEvent(io, "agentwatch:event", populated, vessel._id);
    return { event: populated, sequence, analysis, duplicate: false };
};

const processAgentWatchNetworkEvent = (networkEvent, io) => {
    if (networkEvent.verdict === "ALLOWED" || !networkEvent.sourceIp) return Promise.resolve(null);
    return ingestAgentWatchEvent({
        vessel: networkEvent.vessel, sourceIp: networkEvent.sourceIp,
        sourceDevice: networkEvent.sourceDevice, eventKind: "NETWORK_CONNECTION",
        target: networkEvent.domain || networkEvent.destinationIp || networkEvent.destinationSegment,
        details: { verdict: networkEvent.verdict, reason: networkEvent.reason },
        networkEvent: networkEvent._id, simulated: networkEvent.simulated, timestamp: networkEvent.timestamp,
    }, io).catch((error) => console.error("AgentWatch network correlation error:", error.message));
};

module.exports = { STAGE_ORDER, KIND_TO_STAGE, MITRE_MAP, median, analyzeAttackSequence, isolateSource, ingestAgentWatchEvent, processAgentWatchNetworkEvent };
