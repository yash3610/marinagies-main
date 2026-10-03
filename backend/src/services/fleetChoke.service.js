const crypto = require("node:crypto");
const Supplier = require("../models/Supplier");
const SupplyChainAsset = require("../models/SupplyChainAsset");
const EdgeDevice = require("../models/EdgeDevice");
const Alert = require("../models/Alert");
const { emitVesselEvent } = require("./realtime.service");
const { writeAuditLog } = require("./audit.service");

const CRITICALITY_WEIGHT = { STANDARD: 1, OPERATIONAL: 2, SAFETY_CRITICAL: 4 };
const levelFor = (score) => score >= 80 ? "CRITICAL" : score >= 55 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

const calculateSupplierRisk = ({ supplier, assets = [], edgeDevices = [] }) => {
    const vesselIds = new Set(assets.map((asset) => String(asset.vessel?._id || asset.vessel)));
    const blastRadius = assets.reduce((sum, asset) => sum + (CRITICALITY_WEIGHT[asset.criticality] || 1), 0);
    const maxCvss = Math.max(0, ...(supplier.cves || []).map((cve) => Number(cve.cvssScore || 0)));
    const cveRisk = maxCvss * 10;
    const anomalyRisk = edgeDevices.length
        ? edgeDevices.reduce((sum, device) => sum + Number(device.health?.riskScore || 0), 0) / edgeDevices.length
        : assets.some((asset) => asset.operationalStatus === "DEGRADED" || asset.operationalStatus === "OFFLINE") ? 40 : 0;
    const exposureRisk = Math.min(100, vesselIds.size * 10 + blastRadius * 4);
    const riskScore = clamp(Number(supplier.baseRisk || 0) * 0.1 + cveRisk * 0.5 + anomalyRisk * 0.2 + exposureRisk * 0.2);
    const factors = [];
    if (maxCvss > 0) factors.push(`Highest supplier CVSS score is ${maxCvss.toFixed(1)}.`);
    if (anomalyRisk > 0) factors.push(`Linked field-device anomaly risk averages ${Math.round(anomalyRisk)}%.`);
    factors.push(`${assets.length} asset(s) across ${vesselIds.size} vessel(s) create a weighted blast radius of ${blastRadius}.`);
    const riskLevel = levelFor(riskScore);
    return {
        riskScore, riskLevel, blastRadius, affectedVesselCount: vesselIds.size, assetCount: assets.length,
        explanation: {
            summary: `${supplier.name} has ${riskLevel.toLowerCase()} supply-chain risk at ${riskScore}%.`,
            factors,
            recommendation: riskScore >= 70
                ? "Prioritize firmware validation, supplier contact and compensating controls on every affected vessel."
                : riskScore >= 25 ? "Monitor linked assets and remediate known firmware exposure." : "Continue routine supplier and firmware monitoring.",
        },
    };
};

const buildWhatIfScenario = ({ supplier, assets, compromiseSeverity }) => {
    const groups = new Map();
    for (const asset of assets) {
        const vessel = asset.vessel?._id || asset.vessel;
        const key = String(vessel);
        const current = groups.get(key) || { vessel, assetCount: 0, criticalityWeight: 0 };
        current.assetCount += 1;
        current.criticalityWeight += CRITICALITY_WEIGHT[asset.criticality] || 1;
        groups.set(key, current);
    }
    const affectedVessels = [...groups.values()].map((item) => {
        const projectedRisk = clamp(Number(compromiseSeverity) * 0.7 + Math.min(30, item.criticalityWeight * 6));
        return { ...item, projectedRisk, impactLevel: levelFor(projectedRisk) };
    }).sort((a, b) => b.projectedRisk - a.projectedRisk);
    const blastRadius = affectedVessels.reduce((sum, item) => sum + item.criticalityWeight, 0);
    return {
        affectedVessels, totalAssets: assets.length, blastRadius,
        summary: `${supplier.name} compromise would affect ${affectedVessels.length} vessel(s), ${assets.length} asset(s), with weighted blast radius ${blastRadius}.`,
    };
};

const recalculateSupplierRisk = async (supplierId, io = null) => {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return null;
    const assets = await SupplyChainAsset.find({ supplier: supplier._id }).lean();
    const edgeDeviceIds = assets.map((asset) => asset.edgeDevice).filter(Boolean);
    const edgeDevices = edgeDeviceIds.length ? await EdgeDevice.find({ _id: { $in: edgeDeviceIds } }).lean() : [];
    const previousRisk = supplier.riskScore;
    const result = calculateSupplierRisk({ supplier, assets, edgeDevices });
    supplier.set({ ...result, lastEvaluatedAt: new Date() });
    await supplier.save();
    if (result.riskScore >= 70 && previousRisk < 70 && assets.length) {
        const primaryAsset = assets.sort((a, b) => (CRITICALITY_WEIGHT[b.criticality] || 1) - (CRITICALITY_WEIGHT[a.criticality] || 1))[0];
        const alert = await Alert.create({
            alertId: `FC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            vessel: primaryAsset.vessel, type: "SYSTEM_ANOMALY",
            severity: result.riskScore >= 85 ? "CRITICAL" : "HIGH",
            title: `FleetChoke: High-risk supplier ${supplier.name}`,
            message: result.explanation.summary, source: "SYSTEM",
            confidence: Math.min(100, 70 + Math.round(result.affectedVesselCount * 3)),
            confidenceLevel: "HIGH", module: "FLEETCHOKE",
            explanation: {
                whatHappened: `${supplier.name} exceeded the configured supply-chain risk threshold.`,
                whyItMatters: `${result.affectedVesselCount} vessel(s) share dependencies from this supplier.`,
                whatCausedIt: result.explanation.factors.join(" "),
                recommendedAction: result.explanation.recommendation,
            },
            evidence: { supplier: supplier._id, riskScore: result.riskScore, blastRadius: result.blastRadius, affectedVesselCount: result.affectedVesselCount },
        });
        emitVesselEvent(io, "alert:new", alert, primaryAsset.vessel);
    }
    emitVesselEvent(io, "fleetchoke:supplier", supplier, null);
    writeAuditLog({
        actorRole: "FLEETCHOKE_ENGINE", action: "SUPPLIER_RISK_RECALCULATED",
        resource: "SUPPLIER", resourceId: String(supplier._id), description: result.explanation.summary,
        metadata: { riskScore: result.riskScore, blastRadius: result.blastRadius, affectedVesselCount: result.affectedVesselCount },
    }).catch((error) => console.error("FleetChoke audit error:", error.message));
    return supplier;
};

const syncEdgeDeviceAsset = async (device, io = null) => {
    const assetId = `EDGE-${device.deviceId}`;
    const existing = await SupplyChainAsset.findOne({ assetId });
    let supplier = existing ? await Supplier.findById(existing.supplier) : null;
    if (!supplier) {
        supplier = await Supplier.findOne({ name: "MarineAegis Lab" });
        if (!supplier) {
            try {
                supplier = await Supplier.create({ supplierId: "SUP-MARINEAEGIS-LAB", name: "MarineAegis Lab", category: "HARDWARE", baseRisk: 5 });
            } catch (error) {
                if (error?.code !== 11000) throw error;
                supplier = await Supplier.findOne({ name: "MarineAegis Lab" });
            }
        }
    }
    const operationalStatus = device.status === "ONLINE" ? "ACTIVE" : device.status === "WARNING" ? "DEGRADED" : "OFFLINE";
    const changed = !existing || existing.firmwareVersion !== device.reportedFirmware || existing.operationalStatus !== operationalStatus || String(existing.vessel) !== String(device.vessel);
    const asset = await SupplyChainAsset.findOneAndUpdate(
        { assetId },
        { $set: {
            vessel: device.vessel, supplier: supplier._id, edgeDevice: device._id,
            name: device.name, category: "SENSOR", deviceModel: device.type,
            firmwareVersion: device.reportedFirmware || "unknown", criticality: device.criticality,
            operationalStatus, lastInventorySyncAt: new Date(),
        } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    if (changed) await recalculateSupplierRisk(supplier._id, io);
    return asset;
};

module.exports = { CRITICALITY_WEIGHT, levelFor, calculateSupplierRisk, buildWhatIfScenario, recalculateSupplierRisk, syncEdgeDeviceAsset };
