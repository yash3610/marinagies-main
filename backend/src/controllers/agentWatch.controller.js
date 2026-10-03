const crypto = require("node:crypto");
const mongoose = require("mongoose");
const AgentWatchEvent = require("../models/AgentWatchEvent");
const AttackSequence = require("../models/AttackSequence");
const AutonomousAttackPattern = require("../models/AutonomousAttackPattern");
const NetworkPolicy = require("../models/NetworkPolicy");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { emitVesselEvent } = require("../services/realtime.service");
const { ingestAgentWatchEvent } = require("../services/agentWatch.service");

const populateSequence = (query) => query
    .populate("vessel", "name vesselId status riskScore riskLevel")
    .populate("events")
    .populate("reviewedBy", "name email role")
    .populate("alert", "alertId severity status")
    .populate("incident", "incidentId severity status");

const getAgentWatchOverview = async (req, res) => {
    try {
        const filter = { ...vesselScope(req) };
        if (req.query.vessel) {
            if (!mongoose.isValidObjectId(req.query.vessel) || !canAccessVessel(req, req.query.vessel)) {
                return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
            }
            filter.vessel = req.query.vessel;
        }
        const [sequences, events, patterns, policies] = await Promise.all([
            populateSequence(AttackSequence.find(filter).sort({ createdAt: -1 }).limit(100)).lean(),
            AgentWatchEvent.find(filter).populate("vessel", "name vesselId").sort({ timestamp: -1 }).limit(300).lean(),
            AutonomousAttackPattern.find({ active: true }).sort({ sharedAt: -1 }).limit(100).lean(),
            NetworkPolicy.find(filter).populate("vessel", "name vesselId").select("vessel isolatedSources policyVersion").lean(),
        ]);
        res.status(200).json({
            success: true, sequences, events, patterns, policies,
            stats: {
                sequences: sequences.length,
                highConfidence: sequences.filter((item) => item.confidenceLevel === "HIGH").length,
                isolatedSources: policies.reduce((total, policy) => total + policy.isolatedSources.filter((item) => item.active).length, 0),
                confirmedPatterns: patterns.length,
            },
        });
    } catch (error) {
        console.error("Get AgentWatch overview error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch AgentWatch data" });
    }
};

const ingestEvent = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const result = await ingestAgentWatchEvent(req.body, req.app.get("io"));
        res.status(result.duplicate ? 200 : 201).json({ success: true, message: result.sequence ? "Autonomous attack sequence detected" : "Security event recorded", ...result });
    } catch (error) {
        res.status(error.status || 400).json({ success: false, message: error.message || "Failed to ingest AgentWatch event" });
    }
};

const simulateAttack = async (req, res) => {
    try {
        const vessel = req.body?.vessel;
        if (!mongoose.isValidObjectId(vessel) || !canAccessVessel(req, vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const sourceIp = req.body.sourceIp || `192.0.2.${Math.floor(Math.random() * 200) + 10}`;
        const base = Date.now() - 3500;
        const kinds = ["NETWORK_SCAN", "NETWORK_SCAN", "AUTH_FAILURE", "AUTH_SUCCESS", "PRIVILEGE_ESCALATION", "COMMAND_EXECUTION", "EXFILTRATION"];
        const results = [];
        for (let index = 0; index < kinds.length; index += 1) {
            results.push(await ingestAgentWatchEvent({
                vessel, sourceIp, sourceDevice: "MOCK-AUTONOMOUS-AGENT", userAccount: "maintenance-service",
                eventId: `agentwatch-demo:${vessel}:${Date.now()}:${index}:${crypto.randomUUID()}`,
                eventKind: kinds[index], target: index < 2 ? "vessel-network" : index < 5 ? "engineering-workstation" : "navigation-database",
                details: { demo: true, step: index + 1 }, simulated: true, timestamp: new Date(base + index * 500),
            }, req.app.get("io")));
        }
        const sequence = results.map((item) => item.sequence).find(Boolean) || null;
        res.locals.auditVesselId = vessel;
        res.locals.auditResourceId = sequence ? String(sequence._id) : null;
        res.status(201).json({ success: true, message: sequence ? "Machine-speed attack detected and source isolated" : "Attack events simulated", sourceIp, sequence });
    } catch (error) {
        res.status(error.status || 400).json({ success: false, message: error.message || "Attack simulation failed" });
    }
};

const reviewSequence = async (req, res) => {
    try {
        const sequence = await AttackSequence.findOne({ _id: req.params.id, ...vesselScope(req) }).populate("events");
        if (!sequence) return res.status(404).json({ success: false, message: "Attack sequence not found" });
        const decision = String(req.body.decision || "").toUpperCase();
        if (!["CONFIRMED", "FALSE_POSITIVE"].includes(decision)) return res.status(400).json({ success: false, message: "Decision must be CONFIRMED or FALSE_POSITIVE" });
        if (sequence.reviewStatus !== "PENDING") return res.status(409).json({ success: false, message: `Sequence was already reviewed as ${sequence.reviewStatus}` });
        sequence.reviewStatus = decision;
        sequence.reviewedBy = req.user.userId;
        sequence.reviewedAt = new Date();
        sequence.reviewNote = req.body.note || (decision === "CONFIRMED" ? "Confirmed autonomous attack pattern" : "Analyst marked false positive");
        let pattern = null;
        if (decision === "CONFIRMED") {
            const eventKinds = [...new Set(sequence.events.map((event) => event.eventKind))];
            const signature = crypto.createHash("sha256").update(`${sequence.stages.join(">")}|${eventKinds.join(">")}`).digest("hex");
            pattern = await AutonomousAttackPattern.findOne({ signature });
            if (pattern) {
                pattern.stageSequence = sequence.stages;
                pattern.eventKinds = eventKinds;
                pattern.mitreTechniqueIds = sequence.mitreTechniques.map((item) => item.techniqueId);
                pattern.confidence = sequence.confidence;
                pattern.sourceSequence = sequence._id;
                pattern.confirmedBy = req.user.userId;
                pattern.sharedAt = new Date();
                pattern.active = true;
                pattern.occurrences += 1;
                await pattern.save();
            } else {
                pattern = await AutonomousAttackPattern.create({
                    signature, stageSequence: sequence.stages, eventKinds,
                    mitreTechniqueIds: sequence.mitreTechniques.map((item) => item.techniqueId),
                    confidence: sequence.confidence, occurrences: 1, sourceSequence: sequence._id,
                    confirmedBy: req.user.userId, sharedAt: new Date(), active: true,
                });
            }
        } else {
            if (sequence.isolated) {
                const policy = await NetworkPolicy.findOne({ vessel: sequence.vessel });
                const isolation = policy?.isolatedSources.find((item) => item.sourceIp === sequence.sourceIp && item.active);
                if (isolation) {
                    isolation.active = false;
                    isolation.releasedAt = new Date();
                    isolation.releasedBy = req.user.userId;
                    policy.policyVersion += 1;
                    await policy.save();
                    emitVesselEvent(req.app.get("io"), "netguard:policy", policy, sequence.vessel);
                }
                sequence.isolated = false;
            }
            if (sequence.alert) await Alert.updateOne({ _id: sequence.alert }, { $set: { status: "FALSE_POSITIVE", resolvedAt: new Date(), resolvedBy: req.user.userId } });
            if (sequence.incident) await Incident.updateOne({ _id: sequence.incident }, { $set: { status: "RESOLVED", resolvedAt: new Date() } });
        }
        await sequence.save();
        res.locals.auditVesselId = String(sequence.vessel);
        res.locals.auditResourceId = String(sequence._id);
        const populated = await populateSequence(AttackSequence.findById(sequence._id)).lean();
        emitVesselEvent(req.app.get("io"), "agentwatch:sequence", populated, sequence.vessel);
        res.status(200).json({ success: true, message: decision === "CONFIRMED" ? "Sequence confirmed and shared with Fleet Learning" : "False positive recorded and source isolation released", sequence: populated, pattern });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Sequence review failed" });
    }
};

const releaseSource = async (req, res) => {
    try {
        const sequence = await AttackSequence.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!sequence) return res.status(404).json({ success: false, message: "Attack sequence not found" });
        const policy = await NetworkPolicy.findOne({ vessel: sequence.vessel });
        const isolation = policy?.isolatedSources.find((item) => item.sourceIp === sequence.sourceIp && item.active);
        if (!isolation) return res.status(409).json({ success: false, message: "Source is not currently isolated" });
        isolation.active = false;
        isolation.releasedAt = new Date();
        isolation.releasedBy = req.user.userId;
        policy.policyVersion += 1;
        await policy.save();
        sequence.isolated = false;
        await sequence.save();
        res.locals.auditVesselId = String(sequence.vessel);
        res.locals.auditResourceId = String(sequence._id);
        emitVesselEvent(req.app.get("io"), "netguard:policy", policy, sequence.vessel);
        emitVesselEvent(req.app.get("io"), "agentwatch:sequence", sequence, sequence.vessel);
        res.status(200).json({ success: true, message: "Source isolation released", sequence });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to release source" });
    }
};

module.exports = { getAgentWatchOverview, ingestEvent, simulateAttack, reviewSequence, releaseSource };
