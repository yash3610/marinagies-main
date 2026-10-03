const crypto = require("node:crypto");
const ComplianceReport = require("../models/ComplianceReport");
const EdgeDevice = require("../models/EdgeDevice");
const SupplyChainAsset = require("../models/SupplyChainAsset");
const Incident = require("../models/Incident");
const RemoteCommand = require("../models/RemoteCommand");
const NetworkEvent = require("../models/NetworkEvent");
const RecoveryCase = require("../models/RecoveryCase");
const Supplier = require("../models/Supplier");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { getPermissionsForRole } = require("../utils/accessControl");
const { createTextPdf } = require("./pdf.service");
const { writeAuditLog } = require("./audit.service");

const TYPES = ["ASSET_INVENTORY", "INCIDENT_RESPONSE", "COMMAND_HISTORY", "NETWORK_ACTIVITY", "RECOVERY_ACTION", "FLEET_RISK", "USER_ACCESS_RBAC"];
const stable = (value) => {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") return Object.keys(value).sort().reduce((result, key) => ({ ...result, [key]: stable(value[key]) }), {});
    return value;
};
const hashContent = (content) => crypto.createHash("sha256").update(JSON.stringify(stable(content))).digest("hex");
const dateFilter = (field, from, to) => ({ [field]: { $gte: from, $lte: to } });
const withVessel = (query, vessel, field = "vessel") => vessel ? { ...query, [field]: vessel } : query;

const buildReportContent = async ({ type, vessel, from, to }) => {
    if (type === "ASSET_INVENTORY") {
        const [devices, assets] = await Promise.all([
            EdgeDevice.find(withVessel({}, vessel)).select("deviceId vessel name type source criticality status containmentState reportedFirmware approvedFirmware health lastHeartbeatAt").populate("vessel", "name vesselId").lean(),
            SupplyChainAsset.find(withVessel({}, vessel)).select("assetId vessel supplier name category deviceModel firmwareVersion criticality operationalStatus knownCves lastInventorySyncAt").populate("vessel", "name vesselId").populate("supplier", "name supplierId riskScore riskLevel").lean(),
        ]);
        return { control: "CA-01", description: "Current vessel device and software asset inventory", devices, supplyChainAssets: assets };
    }
    if (type === "INCIDENT_RESPONSE") return { incidents: await Incident.find(withVessel(dateFilter("detectedAt", from, to), vessel)).populate("vessel", "name vesselId").sort({ detectedAt: -1 }).limit(1000).lean() };
    if (type === "COMMAND_HISTORY") return { commands: await RemoteCommand.find(withVessel(dateFilter("issuedAt", from, to), vessel)).select("commandId vessel operator operatorRole type issuedAt riskPercent decision status outcome review execution simulated").populate("vessel", "name vesselId").populate("operator", "name email role").sort({ issuedAt: -1 }).limit(1000).lean() };
    if (type === "NETWORK_ACTIVITY") return { events: await NetworkEvent.find(withVessel(dateFilter("timestamp", from, to), vessel)).select("eventId vessel eventType sourceDevice sourceSegment destinationSegment domain destinationIp destinationPort protocol verdict reason confidence riskScore timestamp simulated").populate("vessel", "name vesselId").sort({ timestamp: -1 }).limit(1000).lean() };
    if (type === "RECOVERY_ACTION") return { cases: await RecoveryCase.find(withVessel(dateFilter("createdAt", from, to), vessel)).populate("vessel", "name vesselId").populate("selectedSnapshot", "snapshotId kind sha256 locked").sort({ createdAt: -1 }).limit(1000).lean() };
    if (type === "FLEET_RISK") {
        const [suppliers, assets] = await Promise.all([Supplier.find().sort({ riskScore: -1 }).lean(), SupplyChainAsset.find(withVessel({}, vessel)).populate("vessel", "name vesselId").populate("supplier", "name supplierId riskScore riskLevel").lean()]);
        return { suppliers, assets };
    }
    if (type === "USER_ACCESS_RBAC") {
        const [users, audit] = await Promise.all([
            User.find().select("name email role active allVessels vesselAccess fleetAccess mfa.enabled lastLoginAt").populate("vesselAccess", "name vesselId").lean(),
            AuditLog.find(dateFilter("createdAt", from, to)).select("user actorRole vessel action resource resourceId status sequenceNumber entryHash createdAt").populate("user", "name email role").sort({ createdAt: -1 }).limit(1000).lean(),
        ]);
        return { users: users.map((user) => ({ ...user, effectivePermissions: getPermissionsForRole(user.role) })), auditTrail: audit };
    }
    throw Object.assign(new Error("Unsupported report type"), { status: 400 });
};

const countRecords = (content) => Object.values(content).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
const generateComplianceReport = async ({ type, vessel, from, to, actor }) => {
    if (!TYPES.includes(type)) throw Object.assign(new Error("Invalid compliance report type"), { status: 400 });
    const content = {
        schemaVersion: "1.0", framework: "IACS_UR_E26", generatedAt: new Date().toISOString(),
        scope: { vessel: vessel || "FLEET", from: from.toISOString(), to: to.toISOString() },
        controls: ["CA-01", "CA-02", "CA-03", "CA-04", "CA-05", "CA-06", "CA-07"],
        evidence: await buildReportContent({ type, vessel, from, to }),
    };
    const recordCount = countRecords(content.evidence);
    const report = await ComplianceReport.create({ reportId: `CMP-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, type, vessel: vessel || null, dateRange: { from, to }, generatedBy: actor, summary: { recordCount, headline: `${recordCount} evidence records captured for ${type.replaceAll("_", " ")}` }, content, contentHash: hashContent(content), locked: true });
    await writeAuditLog({ user: actor, actorRole: "COMPLIANCE_REPORTER", vessel: vessel || null, action: "COMPLIANCE_REPORT_GENERATED", resource: "COMPLIANCE_REPORT", resourceId: String(report._id), description: `${report.reportId} generated and application-WORM locked`, metadata: { type, contentHash: report.contentHash, recordCount, framework: report.framework } });
    return report;
};

const compliancePdf = (report) => {
    const evidence = report.content?.evidence || {};
    const sections = Object.entries(evidence).flatMap(([name, value]) => {
        if (!Array.isArray(value)) return [`${name}: ${JSON.stringify(value)}`];
        return [`${name}: ${value.length} record(s)`, ...value.slice(0, 150).map((item, index) => `${index + 1}. ${JSON.stringify(item)}`)];
    });
    return createTextPdf(`MarineAegis IACS UR E26 Evidence - ${report.reportId}`, [
        `Report type: ${report.type}`, `Framework: ${report.framework}`, `Generated: ${report.createdAt.toISOString()}`,
        `Scope: ${report.vessel || "Fleet"} | ${report.dateRange.from.toISOString()} to ${report.dateRange.to.toISOString()}`,
        `Evidence hash: ${report.contentHash}`, `Storage: ${report.storageMode} | Locked: ${report.locked}`, "", ...sections,
    ]);
};

module.exports = { TYPES, hashContent, generateComplianceReport, compliancePdf };
