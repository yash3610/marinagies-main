const crypto = require("node:crypto");
const NetworkEvent = require("../models/NetworkEvent");
const NetworkPolicy = require("../models/NetworkPolicy");
const ThreatIndicator = require("../models/ThreatIndicator");
const Alert = require("../models/Alert");
const Vessel = require("../models/Vessel");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");
const { processAgentWatchNetworkEvent } = require("./agentWatch.service");

const SEGMENTS = new Set(["OT", "IT", "CREW", "MARINEAEGIS", "UPLINK"]);
const normalizeDomain = (value) => String(value || "").trim().toLowerCase().replace(/\.$/, "");
const isValidDomain = (domain) => domain.length <= 253
    && /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain);

const shannonEntropy = (value) => {
    if (!value) return 0;
    const counts = [...value].reduce((map, character) => map.set(character, (map.get(character) || 0) + 1), new Map());
    return [...counts.values()].reduce((sum, count) => {
        const probability = count / value.length;
        return sum - probability * Math.log2(probability);
    }, 0);
};

const scoreUnknownDomain = (domain) => {
    const firstLabel = domain.split(".")[0];
    let score = 0;
    const signals = [];
    const add = (points, signal) => { score += points; signals.push(signal); };
    if (/malware|ransom|exfil|command-?control|credential|phish/i.test(domain)) add(70, "Domain contains a high-risk attack term.");
    if (/\.(zip|top|xyz|click|work)$/.test(domain)) add(20, "Domain uses a frequently abused top-level domain.");
    if (firstLabel.length >= 30) add(20, "Domain label is unusually long.");
    if (shannonEntropy(firstLabel) >= 3.8 && firstLabel.length >= 16) add(25, "Domain label has high character entropy consistent with generated domains.");
    if ((firstLabel.match(/\d/g) || []).length / Math.max(firstLabel.length, 1) > 0.35) add(15, "Domain contains an unusually high numeric ratio.");
    score = Math.min(100, score);
    return { score, signals, suspicious: score >= 70 };
};

const getOrCreatePolicy = (vesselId) => NetworkPolicy.findOneAndUpdate(
    { vessel: vesselId },
    { $setOnInsert: { vessel: vesselId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const evaluateDnsQuery = async ({ domain, policy }) => {
    const normalized = normalizeDomain(domain);
    if (!isValidDomain(normalized)) throw Object.assign(new Error("A valid fully-qualified domain is required"), { status: 400 });
    const indicator = await ThreatIndicator.findOne({ indicatorType: "DOMAIN", value: normalized, active: true });
    if (policy.dns.whitelist.includes(normalized)) {
        return { domain: normalized, verdict: "ALLOWED", reason: "Domain is on the authorized whitelist.", confidence: 100, riskScore: 0, indicator };
    }
    if (policy.dns.localBlocklist.includes(normalized) || indicator?.verdict === "MALICIOUS") {
        return {
            domain: normalized, verdict: "SINKHOLED", sinkholeIp: policy.dns.sinkholeIp,
            reason: indicator?.reason || "Domain is present in the vessel blocklist.", confidence: indicator?.confidence || 100,
            riskScore: indicator?.confidence || 100, indicator,
        };
    }
    const heuristic = scoreUnknownDomain(normalized);
    if (heuristic.suspicious) {
        const learned = await ThreatIndicator.findOneAndUpdate(
            { indicatorType: "DOMAIN", value: normalized },
            {
                $set: {
                    verdict: "SUSPICIOUS", confidence: heuristic.score, reason: heuristic.signals.join(" "),
                    source: "NETGUARD_HEURISTIC", active: true, fleetWide: true, lastSeenAt: new Date(),
                },
                $setOnInsert: { firstSeenAt: new Date() },
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return {
            domain: normalized, verdict: "SINKHOLED", sinkholeIp: policy.dns.sinkholeIp,
            reason: heuristic.signals.join(" "), confidence: heuristic.score, riskScore: heuristic.score, indicator: learned,
        };
    }
    return {
        domain: normalized, verdict: "ALLOWED", reason: heuristic.signals.length
            ? `No blocking threshold reached. ${heuristic.signals.join(" ")}`
            : "No blocklist or suspicious-domain signals matched.",
        confidence: Math.max(60, 100 - heuristic.score), riskScore: heuristic.score, indicator: null,
    };
};

const evaluateSegmentation = ({ sourceSegment, destinationSegment, policy }) => {
    if (!SEGMENTS.has(sourceSegment) || !SEGMENTS.has(destinationSegment)) {
        throw Object.assign(new Error("Valid source and destination network segments are required"), { status: 400 });
    }
    if (sourceSegment === destinationSegment) {
        return { verdict: "ALLOWED", reason: "Traffic remains inside the same network segment.", confidence: 100, riskScore: 0 };
    }
    const rule = policy.segmentationRules.find((item) => item.from === sourceSegment && item.to === destinationSegment);
    if (rule?.action === "ALLOW") return { verdict: "ALLOWED", reason: rule.reason || "Explicit segmentation allow rule.", confidence: 100, riskScore: 0 };
    return {
        verdict: "BLOCKED",
        reason: rule?.reason || "Default-deny policy blocks traffic without an explicit inter-segment allow rule.",
        confidence: 100,
        riskScore: sourceSegment === "CREW" && destinationSegment === "OT" ? 90 : 75,
    };
};

const createNetGuardAlert = async ({ event, policy, io }) => {
    if (event.verdict === "ALLOWED") return null;
    const recent = await Alert.findOne({
        vessel: event.vessel, module: "NETGUARD", status: { $in: ["OPEN", "ACKNOWLEDGED"] },
        "evidence.domain": event.domain, detectedAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
    });
    const hourlyBlocks = await NetworkEvent.countDocuments({
        vessel: event.vessel, verdict: { $in: ["BLOCKED", "SINKHOLED"] }, timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    const rateTriggered = hourlyBlocks >= policy.dns.hourlyAlertThreshold;
    const recentRateAlert = rateTriggered ? await Alert.findOne({
        vessel: event.vessel, module: "NETGUARD", status: { $in: ["OPEN", "ACKNOWLEDGED"] },
        "evidence.rateThreshold": true, detectedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    }) : null;
    if (recent && (!rateTriggered || recentRateAlert)) return null;
    const severity = event.riskScore >= 90 ? "CRITICAL" : event.riskScore >= 70 ? "HIGH" : "MEDIUM";
    const alert = await Alert.create({
        alertId: `NG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        vessel: event.vessel,
        type: "CYBER_ATTACK",
        severity,
        title: rateTriggered && !recentRateAlert
            ? "NetGuard: DNS/network block rate threshold exceeded"
            : event.eventType === "DNS_QUERY" ? "NetGuard: Malicious DNS request blocked" : "NetGuard: Unauthorized network activity blocked",
        message: event.reason,
        source: "SYSTEM",
        confidence: event.confidence,
        confidenceLevel: event.confidence >= 85 ? "HIGH" : "MEDIUM",
        module: "NETGUARD",
        explanation: {
            whatHappened: `${event.sourceDevice} attempted ${event.eventType === "DNS_QUERY" ? `to resolve ${event.domain}` : `${event.sourceSegment} to ${event.destinationSegment} traffic`}.`,
            whyItMatters: "The request violated DNS reputation or vessel network-segmentation policy.",
            whatCausedIt: event.reason,
            recommendedAction: "Review the requesting device and keep the block active unless an analyst confirms a false positive.",
        },
        evidence: { networkEvent: event._id, domain: event.domain, sourceDevice: event.sourceDevice, sourceSegment: event.sourceSegment, destinationSegment: event.destinationSegment, hourlyBlocks, rateThreshold: rateTriggered && !recentRateAlert },
    });
    emitVesselEvent(io, "alert:new", alert, event.vessel);
    return alert;
};

const processNetworkEvent = async (input, io) => {
    if (!input.vessel) throw Object.assign(new Error("A vessel is required"), { status: 400 });
    const vessel = await Vessel.findOne({ _id: input.vessel, isActive: true }).select("_id name vesselId");
    if (!vessel) throw Object.assign(new Error("Vessel not found or inactive"), { status: 404 });
    const eventId = String(input.eventId || `netguard:${vessel._id}:${Date.now()}:${crypto.randomUUID()}`).slice(0, 128);
    const duplicate = await NetworkEvent.findOne({ eventId });
    if (duplicate) return { event: duplicate, vessel, duplicate: true, alert: null };
    const policy = await getOrCreatePolicy(vessel._id);
    const eventType = String(input.eventType || "DNS_QUERY").toUpperCase();
    const sourceSegment = String(input.sourceSegment || "IT").toUpperCase();
    const isolatedSource = policy.isolatedSources.find((item) => item.active && (
        item.sourceIp === input.sourceIp
    ));
    let decision;
    if (isolatedSource) {
        const isolatedDomain = eventType === "DNS_QUERY" ? normalizeDomain(input.domain) : null;
        if (eventType === "DNS_QUERY" && !isValidDomain(isolatedDomain)) {
            throw Object.assign(new Error("A valid fully-qualified domain is required"), { status: 400 });
        }
        decision = {
            domain: isolatedDomain, verdict: "BLOCKED", confidence: 100, riskScore: 100,
            reason: `Source ${input.sourceIp} is isolated by AgentWatch policy. ${isolatedSource.reason}`,
        };
    } else {
        decision = eventType === "DNS_QUERY"
            ? await evaluateDnsQuery({ domain: input.domain, policy })
            : evaluateSegmentation({ sourceSegment, destinationSegment: String(input.destinationSegment || "").toUpperCase(), policy });
    }
    const event = await NetworkEvent.create({
        eventId, vessel: vessel._id, eventType,
        sourceDevice: String(input.sourceDevice || "unknown-device").slice(0, 100),
        sourceIp: input.sourceIp || "", sourceSegment,
        destinationSegment: eventType === "DNS_QUERY" ? "UPLINK" : String(input.destinationSegment).toUpperCase(),
        domain: decision.domain || null, destinationIp: input.destinationIp || "",
        destinationPort: input.destinationPort ?? (eventType === "DNS_QUERY" ? 53 : null),
        protocol: eventType === "DNS_QUERY" ? "DNS" : String(input.protocol || "TCP").toUpperCase(),
        satelliteProvider: policy.satellite.activeProvider,
        verdict: decision.verdict, reason: decision.reason, confidence: decision.confidence,
        riskScore: decision.riskScore, sinkholeIp: decision.sinkholeIp || null,
        threatIndicator: decision.indicator?._id || null, simulated: Boolean(input.simulated),
        timestamp: input.timestamp || new Date(),
    });
    const alert = await createNetGuardAlert({ event, policy, io });
    processAgentWatchNetworkEvent(event, io);
    const populated = await NetworkEvent.findById(event._id).populate("vessel", "name vesselId").lean();
    emitVesselEvent(io, "netguard:event", populated, vessel._id);
    writeAuditLog({
        actorRole: "NETGUARD_ENGINE", vessel: vessel._id,
        action: event.verdict === "ALLOWED" ? "NETWORK_REQUEST_ALLOWED" : "NETWORK_REQUEST_BLOCKED",
        resource: "NETWORK_EVENT", resourceId: String(event._id), description: event.reason,
        metadata: { eventId, verdict: event.verdict, domain: event.domain, riskScore: event.riskScore },
    }).catch((error) => console.error("NetGuard audit error:", error.message));
    return { event: populated, vessel, policy, duplicate: false, alert };
};

module.exports = {
    normalizeDomain, isValidDomain, shannonEntropy, scoreUnknownDomain, getOrCreatePolicy,
    evaluateDnsQuery, evaluateSegmentation, processNetworkEvent,
};
