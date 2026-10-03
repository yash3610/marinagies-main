const crypto = require("node:crypto");
const RemoteCommand = require("../models/RemoteCommand");
const OperatorCommandBaseline = require("../models/OperatorCommandBaseline");
const Vessel = require("../models/Vessel");
const VesselCurrentState = require("../models/VesselCurrentState");
const SarWeatherCache = require("../models/SarWeatherCache");
const SimulationSession = require("../models/SimulationSession");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { normalizeRole } = require("../utils/accessControl");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");
const { publishIndicator } = require("./threatIntelligence.service");
const { appendIncidentEventSafely } = require("./incidentTimeline.service");
const { distanceKm } = require("./sarVerify.service");
const { inferActiveModel } = require("./mlRuntime.service");
const { runtimeFeatures } = require("./mlTraining.service");

const WEIGHTS = Object.freeze({ routeDeviation: 0.30, operatorPattern: 0.25, environmentalContext: 0.20, timeAnomaly: 0.10, sequenceAnomaly: 0.10, authorityCheck: 0.05 });
const COMMAND_TYPES = Object.freeze(["SET_HEADING", "SET_SPEED", "CHANGE_ROUTE", "STOP_ENGINE", "EMERGENCY_STOP", "RETURN_TO_PORT", "ENTER_SAFE_MODE"]);
const ROLE_COMMANDS = Object.freeze({
    ADMIN: COMMAND_TYPES,
    BRIDGE_CREW: ["SET_HEADING", "SET_SPEED", "STOP_ENGINE", "EMERGENCY_STOP", "ENTER_SAFE_MODE"],
    ROC_OPERATOR: COMMAND_TYPES,
    NETWORK_SECURITY: ["EMERGENCY_STOP", "ENTER_SAFE_MODE"],
    FLEET_MANAGER: ["CHANGE_ROUTE", "RETURN_TO_PORT", "ENTER_SAFE_MODE"],
    COMPLIANCE_AUDITOR: [],
});
const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const angularDifference = (a, b) => Math.abs(((Number(a) - Number(b) + 540) % 360) - 180);

const scoreRemoteCommand = ({ input, operatorRole, baseline = null, vesselState = {}, weather = null, recentCommands = [] }) => {
    const type = String(input.type || "").toUpperCase();
    const parameters = input.parameters || {};
    const currentHeading = Number(vesselState.heading || 0);
    let route = 0.1;
    const routeReasons = [];
    if (type === "SET_HEADING") {
        const difference = angularDifference(parameters.heading, currentHeading);
        route = clamp(difference / 120);
        routeReasons.push(`Requested heading differs from current mission heading by ${difference.toFixed(0)} degrees.`);
    } else if (type === "CHANGE_ROUTE") {
        const distance = Number(parameters.distanceKm || 0);
        const difference = angularDifference(parameters.heading ?? currentHeading, currentHeading);
        route = clamp(difference / 180 * 0.6 + distance / 500 * 0.4);
        routeReasons.push(`Route change requests ${difference.toFixed(0)} degrees and ${distance.toFixed(0)} km of deviation.`);
    } else if (["STOP_ENGINE", "EMERGENCY_STOP", "RETURN_TO_PORT"].includes(type)) {
        route = type === "EMERGENCY_STOP" ? 0.35 : 0.55;
        routeReasons.push(`${type.replaceAll("_", " ")} interrupts the active mission.`);
    } else routeReasons.push("Command remains within the active mission envelope.");

    const total = Number(baseline?.totalCommands || 0);
    const sameType = Number(baseline?.commandTypeCounts?.[type] || 0);
    const typeFrequency = total ? sameType / total : 0;
    const pattern = total < 5 ? 0.3 : sameType === 0 ? 0.9 : clamp(0.75 - typeFrequency);
    const patternReasons = [total < 5 ? "Operator baseline is still learning from limited command history." : `${type} represents ${Math.round(typeFrequency * 100)}% of this operator's previous commands.`];

    let environment = 0.1;
    const environmentalReasons = [];
    if (["WARNING", "CRITICAL"].includes(vesselState.status)) { environment += 0.3; environmentalReasons.push(`Vessel is currently ${vesselState.status.toLowerCase()}.`); }
    if (Number(vesselState.speed || 0) > 20 && ["CHANGE_ROUTE", "STOP_ENGINE"].includes(type)) { environment += 0.25; environmentalReasons.push("High vessel speed increases command impact."); }
    if (["ROUGH", "STORM"].includes(weather?.condition)) { environment += weather.condition === "STORM" ? 0.35 : 0.2; environmentalReasons.push(`Local cached weather is ${weather.condition.toLowerCase()}.`); }
    if (!environmentalReasons.length) environmentalReasons.push("No elevated local environmental hazards were found.");
    environment = clamp(environment);

    const issuedAt = new Date(input.issuedAt || Date.now());
    const hour = issuedAt.getUTCHours();
    const hourCount = Number(baseline?.hourCounts?.[String(hour)] || 0);
    const time = total < 5 ? 0.25 : hourCount / total < 0.05 ? 0.85 : 0.15;
    const timeReasons = [total < 5 ? "Insufficient timing history; neutral anomaly prior applied." : hourCount ? `${hour}:00 UTC is present in the operator baseline.` : `${hour}:00 UTC has not appeared in the operator baseline.`];

    const highRecent = recentCommands.filter((item) => item.decision === "BLOCK").length;
    const differentRecent = recentCommands.filter((item) => item.type !== type).length;
    const sequence = clamp(recentCommands.length * 0.15 + highRecent * 0.25 + differentRecent * 0.08);
    const sequenceReasons = [recentCommands.length ? `${recentCommands.length} command(s), including ${highRecent} blocked command(s), arrived in the previous five minutes.` : "No unusual recent command sequence was found."];

    const normalizedRole = normalizeRole(operatorRole);
    const roleAuthorized = (ROLE_COMMANDS[normalizedRole] || []).includes(type);
    const channelAuthenticated = input.channelAuthenticated !== false;
    const authorized = roleAuthorized && channelAuthenticated;
    const authority = authorized ? 0 : 1;
    const authorityReasons = [!channelAuthenticated ? "The remote command channel failed origin authentication." : authorized ? `${normalizedRole} is authorized for ${type}.` : `${normalizedRole} is not authorized for ${type}.`];
    const raw = { routeDeviation: route, operatorPattern: pattern, environmentalContext: environment, timeAnomaly: time, sequenceAnomaly: sequence, authorityCheck: authority };
    const riskScore = Number(Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + raw[key] * weight, 0).toFixed(3));
    const decision = !authorized || riskScore >= 0.70 ? "BLOCK" : riskScore > 0.30 ? "HOLD" : "AUTO_EXECUTE";
    const riskFactors = {
        routeDeviation: { score: Number(route.toFixed(3)), weight: WEIGHTS.routeDeviation, reasons: routeReasons },
        operatorPattern: { score: Number(pattern.toFixed(3)), weight: WEIGHTS.operatorPattern, reasons: patternReasons },
        environmentalContext: { score: Number(environment.toFixed(3)), weight: WEIGHTS.environmentalContext, reasons: environmentalReasons },
        timeAnomaly: { score: Number(time.toFixed(3)), weight: WEIGHTS.timeAnomaly, reasons: timeReasons },
        sequenceAnomaly: { score: Number(sequence.toFixed(3)), weight: WEIGHTS.sequenceAnomaly, reasons: sequenceReasons },
        authorityCheck: { score: authority, weight: WEIGHTS.authorityCheck, reasons: authorityReasons },
    };
    return { riskFactors, riskScore, riskPercent: Math.round(riskScore * 100), decision, status: decision === "AUTO_EXECUTE" ? "INTERCEPTED" : decision === "HOLD" ? "PENDING_APPROVAL" : "BLOCKED", requiresMfa: decision !== "AUTO_EXECUTE", explanation: { whatHappened: `${type.replaceAll("_", " ")} command was intercepted before reaching vessel controls.`, whyItMatters: decision === "AUTO_EXECUTE" ? "The command matches mission, operator and environmental expectations." : decision === "HOLD" ? "The command contains unusual characteristics and requires explicit ROC supervisor approval." : "The command exceeds the safe risk limit or the operator lacks authority.", whatCausedIt: `Composite command risk is ${Math.round(riskScore * 100)}% across six integrity checks.`, recommendedAction: decision === "AUTO_EXECUTE" ? "Monitor the command outcome." : decision === "HOLD" ? "A ROC supervisor must complete MFA re-authentication before approving or rejecting it." : "Keep the command blocked, acknowledge it with MFA and investigate the operator session." } };
};

const executeCommand = async (command, io) => {
    const changes = {};
    const parameters = command.parameters || {};
    if (command.type === "SET_HEADING") changes.heading = Math.max(0, Math.min(360, Number(parameters.heading)));
    if (command.type === "SET_SPEED") changes.speed = Math.max(0, Math.min(100, Number(parameters.speed)));
    if (["STOP_ENGINE", "EMERGENCY_STOP"].includes(command.type)) changes.speed = 0;
    if (command.type === "CHANGE_ROUTE") changes.destination = String(parameters.destination || "Remote waypoint").slice(0, 150);
    if (command.type === "RETURN_TO_PORT") changes.destination = String(parameters.destination || "Origin port").slice(0, 150);
    if (Object.keys(changes).length) {
        await Vessel.updateOne({ _id: command.vessel }, { $set: changes }, { runValidators: true });
        const stateChanges = {};
        if (changes.heading !== undefined) stateChanges.heading = changes.heading;
        if (changes.speed !== undefined) stateChanges.speed = changes.speed;
        if (Object.keys(stateChanges).length) await VesselCurrentState.updateOne({ vessel: command.vessel }, { $set: stateChanges }, { runValidators: true });
    }
    if (command.type === "ENTER_SAFE_MODE") await activateSafeMode(command.vessel, command.operator, `ROCShield command ${command.commandId}`, io);
    command.status = "EXECUTED";
    command.execution = { executedAt: new Date(), appliedChanges: changes };
    command.outcome = Object.keys(changes).length ? `Applied ${Object.keys(changes).join(", ")} to vessel state` : "Command dispatched to local vessel control bus";
    await command.save();
    emitVesselEvent(io, "rocshield:execution", { commandId: command.commandId, type: command.type, parameters: command.parameters, executedAt: command.execution.executedAt }, command.vessel);
    return command;
};

const activateSafeMode = async (vesselId, actor, reason, io) => {
    const vessel = await Vessel.findById(vesselId).lean();
    if (!vessel) return null;
    const session = await SimulationSession.findOneAndUpdate({ vessel: vesselId }, { $set: { navigationSource: "TRUSTED_POSITION", safeMode: { active: true, enteredAt: new Date(), enteredBy: actor || null, reason }, hardware: { greenLed: false, redLed: true, buzzer: true } }, $setOnInsert: { status: "IDLE", actual: { latitude: vessel.latitude, longitude: vessel.longitude, speed: vessel.speed || 0, heading: vessel.heading || 0 } } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    await Vessel.updateOne({ _id: vesselId }, { $set: { status: "WARNING", riskScore: Math.max(70, vessel.riskScore || 0), riskLevel: "HIGH" } });
    emitVesselEvent(io, "simulation:update", session, vesselId);
    return session;
};

const updateBaseline = async (operator, type, riskScore, blocked) => {
    const baseline = await OperatorCommandBaseline.findOne({ operator });
    if (!baseline) return OperatorCommandBaseline.create({ operator, totalCommands: 1, commandTypeCounts: { [type]: 1 }, hourCounts: { [String(new Date().getUTCHours())]: 1 }, averageRisk: riskScore, blockedCommands: blocked ? 1 : 0, lastCommandAt: new Date(), lastCommandType: type });
    const nextTotal = baseline.totalCommands + 1;
    baseline.commandTypeCounts = { ...(baseline.commandTypeCounts || {}), [type]: Number(baseline.commandTypeCounts?.[type] || 0) + 1 };
    const hour = String(new Date().getUTCHours());
    baseline.hourCounts = { ...(baseline.hourCounts || {}), [hour]: Number(baseline.hourCounts?.[hour] || 0) + 1 };
    baseline.averageRisk = (baseline.averageRisk * baseline.totalCommands + riskScore) / nextTotal;
    baseline.totalCommands = nextTotal;
    if (blocked) baseline.blockedCommands += 1;
    baseline.lastCommandAt = new Date(); baseline.lastCommandType = type;
    return baseline.save();
};

const createThreatResponse = async (command, io) => {
    if (command.decision === "AUTO_EXECUTE") return executeCommand(command, io);
    const high = command.decision === "BLOCK";
    const alert = await Alert.create({ alertId: `ROC-ALERT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: command.vessel, type: high ? "UNAUTHORIZED_ACCESS" : "CYBER_ATTACK", severity: high ? "CRITICAL" : "HIGH", title: high ? "ROCShield blocked high-risk remote command" : "ROCShield command awaiting supervisor approval", message: command.explanation.whatCausedIt, source: "AI_ENGINE", confidence: command.riskPercent, confidenceLevel: command.riskPercent >= 70 ? "HIGH" : "MEDIUM", module: "ROCSHIELD", explanation: command.explanation, evidence: { remoteCommand: command._id, commandId: command.commandId, riskFactors: command.riskFactors } });
    command.alert = alert._id;
    if (high) {
        const incident = await Incident.create({ incidentId: `ROCI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, vessel: command.vessel, alert: alert._id, type: "UNAUTHORIZED_ACCESS", severity: "CRITICAL", title: "High-risk remote command blocked", description: `${command.explanation.whatHappened} ${command.explanation.whatCausedIt}`, priority: "URGENT", source: "AI_ENGINE", confidence: command.riskPercent });
        command.incident = incident._id;
        appendIncidentEventSafely({ incident: incident._id, vessel: command.vessel, eventType: "DETECTION", title: "ROCShield blocked remote command", description: command.explanation.whyItMatters, source: "ROCSHIELD", severity: "CRITICAL", data: { command: command._id, riskFactors: command.riskFactors } });
        const recentBlocked = await RemoteCommand.countDocuments({ vessel: command.vessel, decision: "BLOCK", interceptedAt: { $gte: new Date(Date.now() - 5 * 60000) } });
        if (recentBlocked >= 3) {
            await activateSafeMode(command.vessel, null, `${recentBlocked} high-risk ROC commands received within five minutes`, io);
            appendIncidentEventSafely({ incident: incident._id, vessel: command.vessel, eventType: "SAFE_MODE_ENTERED", title: "Repeated high-risk commands triggered Safe Mode", description: `${recentBlocked} blocked commands were detected within five minutes.`, source: "ROCSHIELD", severity: "CRITICAL", data: { recentBlocked } });
        }
        emitVesselEvent(io, "incident:new", incident, command.vessel);
    }
    await command.save();
    emitVesselEvent(io, "alert:new", alert, command.vessel);
    return command;
};

const interceptRemoteCommand = async ({ input, operatorId, operatorRole, io }) => {
    const startedAt = Date.now();
    const type = String(input.type || "").toUpperCase();
    if (!COMMAND_TYPES.includes(type)) throw Object.assign(new Error("Unsupported remote command type"), { status: 400 });
    if (type === "SET_HEADING" && (!Number.isFinite(Number(input.parameters?.heading)) || Number(input.parameters.heading) < 0 || Number(input.parameters.heading) > 360)) throw Object.assign(new Error("SET_HEADING requires heading between 0 and 360"), { status: 400 });
    if (type === "SET_SPEED" && (!Number.isFinite(Number(input.parameters?.speed)) || Number(input.parameters.speed) < 0 || Number(input.parameters.speed) > 100)) throw Object.assign(new Error("SET_SPEED requires speed between 0 and 100 knots"), { status: 400 });
    if (type === "CHANGE_ROUTE" && !String(input.parameters?.destination || "").trim()) throw Object.assign(new Error("CHANGE_ROUTE requires a destination"), { status: 400 });
    if (!input.nonce || String(input.nonce).length < 12) throw Object.assign(new Error("A unique nonce of at least 12 characters is required"), { status: 400 });
    const issuedAt = input.issuedAt ? new Date(input.issuedAt) : new Date();
    if (Number.isNaN(issuedAt.getTime()) || Math.abs(Date.now() - issuedAt.getTime()) > 5 * 60000) throw Object.assign(new Error("Command timestamp is outside the five-minute replay window"), { status: 400 });
    const vessel = await Vessel.findOne({ _id: input.vessel, isActive: true });
    if (!vessel) throw Object.assign(new Error("Vessel not found or inactive"), { status: 404 });
    const [state, baseline, recentCommands, weatherRows] = await Promise.all([VesselCurrentState.findOne({ vessel: vessel._id }).lean(), OperatorCommandBaseline.findOne({ operator: operatorId }).lean(), RemoteCommand.find({ operator: operatorId, interceptedAt: { $gte: new Date(Date.now() - 5 * 60000) } }).sort({ interceptedAt: -1 }).limit(20).lean(), SarWeatherCache.find({ observedAt: { $gte: new Date(Date.now() - 24 * 3600000) } }).sort({ observedAt: -1 }).limit(30).lean()]);
    const vesselState = { ...vessel.toObject(), ...(state || {}) };
    const vesselLocation = { latitude: Number(vesselState.latitude), longitude: Number(vesselState.longitude) };
    const weather = Number.isFinite(vesselLocation.latitude) && Number.isFinite(vesselLocation.longitude)
        ? weatherRows.map((row) => ({ row, distance: distanceKm(vesselLocation, row.center) })).filter((item) => item.distance <= item.row.radiusKm).sort((a, b) => a.distance - b.distance)[0]?.row || null
        : null;
    const result = scoreRemoteCommand({ input: { ...input, type, issuedAt }, operatorRole, baseline, vesselState, weather, recentCommands });
    const mlInference = await inferActiveModel("ROCSHIELD", runtimeFeatures.ROCSHIELD(result), vessel._id);
    if (mlInference) {
        result.riskScore = Math.max(result.riskScore, Number(mlInference.probability.toFixed(3)));
        result.riskPercent = Math.round(result.riskScore * 100);
        const authorized = result.riskFactors.authorityCheck.score === 0;
        result.decision = !authorized || result.riskScore >= 0.7 ? "BLOCK" : result.riskScore > 0.3 ? "HOLD" : "AUTO_EXECUTE";
        result.status = result.decision === "AUTO_EXECUTE" ? "INTERCEPTED" : result.decision === "HOLD" ? "PENDING_APPROVAL" : "BLOCKED";
        result.requiresMfa = result.decision !== "AUTO_EXECUTE";
        result.explanation.whatCausedIt += ` Active ${mlInference.modelKey} v${mlInference.version} produced ${(mlInference.probability * 100).toFixed(1)}% unsafe-command probability.`;
    }
    let command;
    try {
        command = await RemoteCommand.create({ commandId: input.commandId || `ROC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, nonce: input.nonce, vessel: vessel._id, operator: operatorId, operatorRole, type, parameters: input.parameters || {}, issuedAt, offlineMode: true, contextSnapshot: { vesselState: { heading: vesselState.heading, speed: vesselState.speed, status: vesselState.status, destination: vesselState.destination }, weather, baseline: baseline || null, mlInference }, ...result, processingTimeMs: Date.now() - startedAt, simulated: Boolean(input.simulated) });
    } catch (error) {
        if (error?.code === 11000) throw Object.assign(new Error("Duplicate command or nonce rejected as a replay"), { status: 409 });
        throw error;
    }
    try {
        await createThreatResponse(command, io);
    } catch (error) {
        command.status = "FAILED";
        command.outcome = `Execution pipeline failed: ${error.message}`.slice(0, 1000);
        await command.save().catch(() => null);
        throw error;
    }
    await updateBaseline(operatorId, type, command.riskScore, command.decision === "BLOCK").catch((error) => console.error("ROCShield baseline update error:", error.message));
    const populated = await RemoteCommand.findById(command._id).populate("vessel", "name vesselId status riskScore riskLevel").populate("operator", "name email role").populate("review.reviewedBy", "name email role").populate("alert", "alertId severity status").populate("incident", "incidentId severity status").lean();
    emitVesselEvent(io, "rocshield:command", populated, vessel._id);
    writeAuditLog({ user: operatorId, actorRole: operatorRole, vessel: vessel._id, action: `REMOTE_COMMAND_${command.decision}`, resource: "REMOTE_COMMAND", resourceId: String(command._id), description: command.explanation.whatCausedIt, metadata: { commandId: command.commandId, type, riskScore: command.riskScore, decision: command.decision, outcome: command.outcome } }).catch((error) => console.error("ROCShield audit error:", error.message));
    if (command.decision === "BLOCK") publishIndicator({ type: "COMMAND_SIGNATURE", value: `${command.type}:${command.operatorRole}`, sourceModule: "ROCSHIELD", sourceRef: { model: "RemoteCommand", id: String(command._id) }, discoveryVessel: vessel._id, severity: command.riskPercent >= 90 ? "CRITICAL" : "HIGH", confidence: command.riskPercent, reason: command.explanation.whatCausedIt, extractedVector: { type: command.type, role: command.operatorRole, decision: command.decision } }, io).catch((error) => console.error("ROCShield intelligence publish error:", error.message));
    return populated;
};

module.exports = { WEIGHTS, COMMAND_TYPES, ROLE_COMMANDS, clamp, angularDifference, scoreRemoteCommand, executeCommand, activateSafeMode, interceptRemoteCommand };
