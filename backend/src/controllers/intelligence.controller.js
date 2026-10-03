const mongoose = require("mongoose");
const UnifiedThreatIndicator = require("../models/UnifiedThreatIndicator");
const FleetModel = require("../models/FleetModel");
const VesselModelDeployment = require("../models/VesselModelDeployment");
const ComplianceReport = require("../models/ComplianceReport");
const { vesselScope, canAccessVessel, getAccessibleVesselIds } = require("../utils/dataScope");
const { publishIndicator, reconcileConfirmedEvidence, syncVesselIndicators } = require("../services/threatIntelligence.service");
const { buildCandidate, validateCandidate, activateModel, syncVesselModels, rollbackDeployment } = require("../services/fleetLearning.service");
const { TYPES, generateComplianceReport, compliancePdf } = require("../services/compliance.service");

const overview = async (req, res) => {
    try {
        const accessible = getAccessibleVesselIds(req);
        const indicatorFilter = accessible === null ? {} : { $or: [{ discoveryVessel: null }, { discoveryVessel: { $in: accessible } }, { fleetWide: true }] };
        const deploymentFilter = vesselScope(req);
        const reportFilter = accessible === null ? {} : { vessel: { $in: accessible } };
        const [indicators, models, deployments, reports] = await Promise.all([
            UnifiedThreatIndicator.find(indicatorFilter).populate("discoveryVessel", "name vesselId").sort({ lastSeenAt: -1 }).limit(300).lean(),
            FleetModel.find().populate("createdBy activatedBy validation.validatedBy", "name email role").sort({ createdAt: -1 }).limit(100).lean(),
            VesselModelDeployment.find(deploymentFilter).populate("vessel", "name vesselId status").sort({ updatedAt: -1 }).limit(300).lean(),
            ComplianceReport.find(reportFilter).select("-content").populate("vessel", "name vesselId").populate("generatedBy", "name email role").sort({ createdAt: -1 }).limit(100).lean(),
        ]);
        res.json({ success: true, indicators, models, deployments, reports, reportTypes: TYPES, thresholds: { precision: 0.9, recall: 0.85 }, stats: { activeIndicators: indicators.filter((item) => item.status === "ACTIVE").length, pendingIndicatorSyncs: indicators.reduce((sum, item) => sum + item.distributions.filter((entry) => entry.status === "PENDING").length, 0), activeModels: models.filter((item) => item.status === "ACTIVE").length, pendingModelDeployments: deployments.filter((item) => item.status === "PENDING").length, lockedReports: reports.filter((item) => item.locked).length } });
    } catch (error) { console.error("Intelligence overview error:", error); res.status(500).json({ success: false, message: "Failed to load intelligence center" }); }
};

const createIndicator = async (req, res) => {
    try {
        if (req.body.discoveryVessel && !canAccessVessel(req, req.body.discoveryVessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const result = await publishIndicator({ ...req.body, extractedVector: {}, sourceModule: "OPERATOR", confirmedBy: req.user.userId }, req.app.get("io"));
        res.locals.auditVesselId = req.body.discoveryVessel || null; res.locals.auditResourceId = String(result.indicator._id);
        res.status(result.duplicate ? 200 : 201).json({ success: true, message: result.duplicate ? "Matching indicator occurrence updated" : "Indicator published fleet-wide", ...result });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};
const reconcile = async (req, res) => { try { const result = await reconcileConfirmedEvidence(req.app.get("io")); res.json({ success: true, message: `${result.created} new indicators extracted from confirmed module evidence`, ...result }); } catch (error) { res.status(400).json({ success: false, message: error.message }); } };
const syncVessel = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.vesselId) || !canAccessVessel(req, req.params.vesselId)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const indicatorsApplied = await syncVesselIndicators(req.params.vesselId); const modelResult = await syncVesselModels(req.params.vesselId);
        res.locals.auditVesselId = req.params.vesselId; res.json({ success: true, message: "Vessel intelligence synchronized", indicatorsApplied, modelsApplied: modelResult.modifiedCount || 0 });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};
const createCandidate = async (req, res) => { try { const model = await buildCandidate({ ...req.body, actor: req.user.userId }); res.status(201).json({ success: true, message: "Fleet rule-pack candidate created from extracted vectors", model }); } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); } };
const validate = async (req, res) => { try { const existing = await FleetModel.findById(req.params.id); if (!existing) return res.status(404).json({ success: false, message: "Fleet model not found" }); const model = await validateCandidate({ model: existing, precision: req.body.precision, recall: req.body.recall, dataset: req.body.dataset, actor: req.user.userId }); res.json({ success: true, message: `Candidate ${model.status.toLowerCase()}`, model }); } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); } };
const activate = async (req, res) => { try { const existing = await FleetModel.findById(req.params.id); if (!existing) return res.status(404).json({ success: false, message: "Fleet model not found" }); const model = await activateModel({ model: existing, actor: req.user.userId }); res.json({ success: true, message: "Validated fleet rule-pack activated and queued for offline vessels", model }); } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); } };
const rollback = async (req, res) => { try { const deployment = await VesselModelDeployment.findOne({ _id: req.params.id, ...vesselScope(req) }); if (!deployment) return res.status(404).json({ success: false, message: "Deployment not found" }); const result = await rollbackDeployment({ deployment, actor: req.user.userId }); res.locals.auditVesselId = String(result.vessel); res.json({ success: true, message: "Vessel model rolled back", deployment: result }); } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); } };

const generateReport = async (req, res) => {
    try {
        const vessel = req.body.vessel || null;
        if (vessel && (!mongoose.isValidObjectId(vessel) || !canAccessVessel(req, vessel))) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        if (!vessel && !req.user.allVessels) return res.status(403).json({ success: false, message: "Fleet-wide reports require all-vessel access" });
        const to = req.body.to ? new Date(req.body.to) : new Date(); const from = req.body.from ? new Date(req.body.from) : new Date(to.getTime() - 30 * 86400000);
        if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from > to) return res.status(400).json({ success: false, message: "A valid date range is required" });
        const report = await generateComplianceReport({ type: String(req.body.type || "").toUpperCase(), vessel, from, to, actor: req.user.userId });
        res.locals.auditVesselId = vessel; res.locals.auditResourceId = String(report._id); res.status(201).json({ success: true, message: "Immutable compliance evidence report generated", report });
    } catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};
const downloadReport = async (req, res) => {
    try {
        const accessible = getAccessibleVesselIds(req); const scope = accessible === null ? {} : { vessel: { $in: accessible } };
        const report = await ComplianceReport.findOne({ _id: req.params.id, ...scope }).lean(); if (!report) return res.status(404).json({ success: false, message: "Compliance report not found" });
        const format = String(req.params.format || "json").toLowerCase();
        if (format === "json") { res.setHeader("Content-Type", "application/json"); res.setHeader("Content-Disposition", `attachment; filename=${report.reportId}.json`); return res.send(JSON.stringify(report, null, 2)); }
        if (format !== "pdf") return res.status(400).json({ success: false, message: "Format must be json or pdf" });
        res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename=${report.reportId}.pdf`); return res.send(compliancePdf(report));
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

module.exports = { overview, createIndicator, reconcile, syncVessel, createCandidate, validate, activate, rollback, generateReport, downloadReport };
