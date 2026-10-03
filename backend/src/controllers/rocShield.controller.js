const crypto = require("node:crypto");
const mongoose = require("mongoose");
const RemoteCommand = require("../models/RemoteCommand");
const OperatorCommandBaseline = require("../models/OperatorCommandBaseline");
const User = require("../models/User");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { interceptRemoteCommand, executeCommand } = require("../services/rocShield.service");
const { generateSecret, verifyTotp } = require("../services/totp.service");
const { emitVesselEvent } = require("../services/realtime.service");
const { appendIncidentEventSafely } = require("../services/incidentTimeline.service");

const populateCommand = (query) => query.populate("vessel", "name vesselId status riskScore riskLevel").populate("operator", "name email role").populate("review.reviewedBy", "name email role").populate("alert", "alertId severity status").populate("incident", "incidentId severity status");

const getOverview = async (req, res) => {
    try {
        const filter = { ...vesselScope(req) };
        if (req.query.vessel) {
            if (!mongoose.isValidObjectId(req.query.vessel) || !canAccessVessel(req, req.query.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
            filter.vessel = req.query.vessel;
        }
        const [commands, baselines] = await Promise.all([populateCommand(RemoteCommand.find(filter).sort({ interceptedAt: -1 }).limit(150)).lean(), OperatorCommandBaseline.find().populate("operator", "name email role").sort({ updatedAt: -1 }).limit(100).lean()]);
        res.status(200).json({ success: true, commands, baselines, stats: { total: commands.length, executed: commands.filter((item) => item.status === "EXECUTED").length, pending: commands.filter((item) => item.status === "PENDING_APPROVAL").length, blocked: commands.filter((item) => ["BLOCKED", "ACKNOWLEDGED"].includes(item.status)).length, averageRisk: commands.length ? Math.round(commands.reduce((sum, item) => sum + item.riskScore, 0) / commands.length * 100) : 0 }, thresholds: { autoExecuteMax: 0.30, blockMin: 0.70 }, mfaEnabled: Boolean(req.user.mfaEnabled) });
    } catch (error) { res.status(500).json({ success: false, message: "Failed to load ROCShield command history" }); }
};

const interceptCommand = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const command = await interceptRemoteCommand({ input: req.body, operatorId: req.user.userId, operatorRole: req.user.role, io: req.app.get("io") });
        res.locals.auditVesselId = String(command.vessel?._id || command.vessel); res.locals.auditResourceId = String(command._id);
        res.status(201).json({ success: true, message: command.decision === "AUTO_EXECUTE" ? "Command verified and executed" : command.decision === "HOLD" ? "Command held for ROC supervisor approval" : "High-risk command blocked", command });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

const requireMfa = async (userId, code) => {
    const user = await User.findById(userId).select("+mfa.secret mfa.enabled name email role");
    if (!user?.mfa?.enabled || !user.mfa.secret) throw Object.assign(new Error("Enable authenticator MFA before reviewing protected commands"), { status: 403 });
    if (!verifyTotp(user.mfa.secret, code)) throw Object.assign(new Error("Invalid or expired authenticator code"), { status: 401 });
    return user;
};

const reviewCommand = async (req, res) => {
    try {
        const decision = String(req.body.decision || "").toUpperCase();
        const command = await RemoteCommand.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!command) return res.status(404).json({ success: false, message: "Remote command not found" });
        if (command.status === "PENDING_APPROVAL" && !["APPROVE", "REJECT"].includes(decision)) return res.status(400).json({ success: false, message: "Pending commands require APPROVE or REJECT" });
        if (command.status === "BLOCKED" && decision !== "ACKNOWLEDGE") return res.status(400).json({ success: false, message: "Blocked commands can only be acknowledged; they cannot be executed" });
        if (!["PENDING_APPROVAL", "BLOCKED"].includes(command.status)) return res.status(409).json({ success: false, message: `Command is already ${command.status.toLowerCase()}` });
        await requireMfa(req.user.userId, req.body.mfaCode);
        command.review = { reviewedBy: req.user.userId, reviewedAt: new Date(), decision, note: String(req.body.note || "").slice(0, 500), mfaVerified: true };
        if (decision === "APPROVE") await executeCommand(command, req.app.get("io"));
        else { command.status = decision === "REJECT" ? "REJECTED" : "ACKNOWLEDGED"; command.outcome = decision === "REJECT" ? "Held command rejected by ROC supervisor" : "Blocked command acknowledged; no vessel action executed"; await command.save(); }
        if (command.alert) await Alert.findByIdAndUpdate(command.alert, { status: decision === "ACKNOWLEDGE" ? "ACKNOWLEDGED" : "RESOLVED", resolvedBy: req.user.userId, resolvedAt: decision === "ACKNOWLEDGE" ? null : new Date() });
        if (command.incident) {
            appendIncidentEventSafely({ incident: command.incident, vessel: command.vessel, eventType: decision === "APPROVE" ? "ACTION_APPROVED" : "ACTION_REJECTED", title: `Remote command ${decision.toLowerCase()}d with MFA`, description: command.review.note, source: "ROCSHIELD", actor: req.user.userId, actorRole: req.user.role, severity: command.decision === "BLOCK" ? "CRITICAL" : "HIGH", data: { command: command._id, mfaVerified: true } });
            await Incident.findByIdAndUpdate(command.incident, { status: decision === "ACKNOWLEDGE" ? "INVESTIGATING" : decision === "REJECT" ? "CONTAINED" : "RESOLVED", ...(decision === "APPROVE" ? { resolvedAt: new Date() } : {}) });
        }
        const populated = await populateCommand(RemoteCommand.findById(command._id)).lean();
        res.locals.auditVesselId = String(command.vessel); res.locals.auditResourceId = String(command._id);
        emitVesselEvent(req.app.get("io"), "rocshield:command", populated, command.vessel);
        res.status(200).json({ success: true, message: `Command ${decision.toLowerCase()}d with MFA verification`, command: populated });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message || "Command review failed" }); }
};

const beginMfaEnrollment = async (req, res) => {
    try {
        const secret = generateSecret();
        const user = await User.findById(req.user.userId).select("name email mfa.enabled");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        await User.updateOne({ _id: user._id }, { $set: { "mfa.pendingSecret": secret } });
        const label = encodeURIComponent(`MarineAegis:${user.email}`);
        res.status(200).json({ success: true, message: "Add this key to an authenticator app, then verify a code", secret, otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=MarineAegis&period=30&digits=6` });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const enableMfa = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("+mfa.pendingSecret mfa.enabled");
        if (!user?.mfa?.pendingSecret) return res.status(409).json({ success: false, message: "Begin MFA enrollment first" });
        if (!verifyTotp(user.mfa.pendingSecret, req.body.mfaCode)) return res.status(401).json({ success: false, message: "Invalid authenticator code" });
        await User.updateOne({ _id: user._id }, { $set: { "mfa.secret": user.mfa.pendingSecret, "mfa.enabled": true, "mfa.verifiedAt": new Date(), "mfa.pendingSecret": null } });
        res.status(200).json({ success: true, message: "Authenticator MFA enabled for ROCShield approvals" });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const simulateCommand = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const scenario = String(req.body.scenario || "SAFE").toUpperCase();
        const fake = scenario === "FAKE";
        const command = await interceptRemoteCommand({ input: { commandId: `ROC-DEMO-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`, nonce: crypto.randomBytes(16).toString("hex"), vessel: req.body.vessel, type: fake ? "CHANGE_ROUTE" : "SET_SPEED", parameters: fake ? { heading: 220, distanceKm: 1200, destination: "Unverified offshore waypoint" } : { speed: 12 }, issuedAt: new Date(), channelAuthenticated: !fake, simulated: true }, operatorId: req.user.userId, operatorRole: req.user.role, io: req.app.get("io") });
        res.locals.auditVesselId = String(command.vessel?._id || command.vessel); res.locals.auditResourceId = String(command._id);
        res.status(201).json({ success: true, message: `${scenario} remote command simulation completed: ${command.decision}`, command });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};

module.exports = { getOverview, interceptCommand, reviewCommand, beginMfaEnrollment, enableMfa, simulateCommand, requireMfa };
