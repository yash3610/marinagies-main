const crypto = require("node:crypto");
const Supplier = require("../models/Supplier");
const SupplyChainAsset = require("../models/SupplyChainAsset");
const SupplyChainScenario = require("../models/SupplyChainScenario");
const Vessel = require("../models/Vessel");
const { vesselScope, canAccessVessel, getAccessibleVesselIds } = require("../utils/dataScope");
const { recalculateSupplierRisk, buildWhatIfScenario } = require("../services/fleetChoke.service");

const getFleetChokeOverview = async (req, res) => {
    try {
        const assetFilter = { ...vesselScope(req) };
        const assets = await SupplyChainAsset.find(assetFilter)
            .populate("vessel", "name vesselId status riskScore riskLevel")
            .populate("supplier", "supplierId name category riskScore riskLevel blastRadius affectedVesselCount explanation cves")
            .sort({ updatedAt: -1 }).lean();
        const supplierIds = [...new Set(assets.map((asset) => String(asset.supplier?._id || asset.supplier)))];
        const [suppliers, scenarios] = await Promise.all([
            Supplier.find({ _id: { $in: supplierIds } }).sort({ riskScore: -1, blastRadius: -1 }).lean(),
            SupplyChainScenario.find({ supplier: { $in: supplierIds } }).populate("supplier", "name supplierId").populate("affectedVessels.vessel", "name vesselId").sort({ simulatedAt: -1 }).limit(30).lean(),
        ]);
        res.status(200).json({
            success: true, suppliers, assets, scenarios,
            stats: {
                suppliers: suppliers.length, assets: assets.length,
                vessels: new Set(assets.map((asset) => String(asset.vessel?._id || asset.vessel))).size,
                highRiskSuppliers: suppliers.filter((supplier) => supplier.riskScore >= 55).length,
                totalBlastRadius: suppliers.reduce((sum, supplier) => sum + supplier.blastRadius, 0),
            },
        });
    } catch (error) {
        console.error("Get FleetChoke overview error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch supply-chain risk data" });
    }
};

const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create({
            supplierId: req.body.supplierId || `SUP-${crypto.randomUUID().slice(0, 8)}`,
            name: req.body.name, category: req.body.category || "OTHER",
            baseRisk: req.body.baseRisk ?? 10, cves: req.body.cves || [],
        });
        res.locals.auditResourceId = String(supplier._id);
        res.status(201).json({ success: true, message: "Supplier registered", supplier });
    } catch (error) {
        res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? "Supplier ID or name already exists" : error.message });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
        for (const field of ["name", "category", "status", "baseRisk", "cves"]) {
            if (req.body[field] !== undefined) supplier[field] = req.body[field];
        }
        await supplier.save();
        const evaluated = await recalculateSupplierRisk(supplier._id, req.app.get("io"));
        res.locals.auditResourceId = String(supplier._id);
        res.status(200).json({ success: true, message: "Supplier updated and risk recalculated", supplier: evaluated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to update supplier" });
    }
};

const createAsset = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        const supplier = await Supplier.findById(req.body.supplier);
        if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
        const asset = await SupplyChainAsset.create({
            assetId: req.body.assetId || `ASSET-${crypto.randomUUID().slice(0, 8)}`,
            vessel: req.body.vessel, supplier: supplier._id, name: req.body.name,
            category: req.body.category || "OTHER", deviceModel: req.body.deviceModel || "Unknown",
            firmwareVersion: req.body.firmwareVersion || "unknown", criticality: req.body.criticality || "OPERATIONAL",
            operationalStatus: req.body.operationalStatus || "ACTIVE", knownCves: req.body.knownCves || [],
        });
        await recalculateSupplierRisk(supplier._id, req.app.get("io"));
        res.locals.auditVesselId = String(asset.vessel);
        res.locals.auditResourceId = String(asset._id);
        res.status(201).json({ success: true, message: "Supply-chain asset registered", asset });
    } catch (error) {
        res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? "Asset ID already exists" : error.message });
    }
};

const updateAsset = async (req, res) => {
    try {
        const asset = await SupplyChainAsset.findOne({ _id: req.params.id, ...vesselScope(req) });
        if (!asset) return res.status(404).json({ success: false, message: "Supply-chain asset not found" });
        if (req.body.supplier !== undefined) {
            const supplierExists = await Supplier.exists({ _id: req.body.supplier });
            if (!supplierExists) return res.status(404).json({ success: false, message: "Supplier not found" });
        }
        const previousSupplier = asset.supplier;
        for (const field of ["supplier", "name", "category", "deviceModel", "firmwareVersion", "criticality", "operationalStatus", "knownCves"]) {
            if (req.body[field] !== undefined) asset[field] = req.body[field];
        }
        await asset.save();
        await recalculateSupplierRisk(asset.supplier, req.app.get("io"));
        if (String(previousSupplier) !== String(asset.supplier)) await recalculateSupplierRisk(previousSupplier, req.app.get("io"));
        res.locals.auditVesselId = String(asset.vessel);
        res.locals.auditResourceId = String(asset._id);
        res.status(200).json({ success: true, message: "Asset updated and supplier risk recalculated", asset });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to update asset" });
    }
};

const simulateCompromise = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.supplierId).lean();
        if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
        const accessibleIds = getAccessibleVesselIds(req);
        const filter = { supplier: supplier._id, ...(accessibleIds === null ? {} : { vessel: { $in: accessibleIds } }) };
        const assets = await SupplyChainAsset.find(filter).populate("vessel", "name vesselId").lean();
        const compromiseSeverity = Math.max(0, Math.min(100, Number(req.body.compromiseSeverity ?? 90)));
        const result = buildWhatIfScenario({ supplier, assets, compromiseSeverity });
        const scenario = await SupplyChainScenario.create({
            scenarioId: `FCS-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            supplier: supplier._id, compromiseSeverity,
            affectedVessels: result.affectedVessels.map((item) => ({ ...item, vessel: item.vessel?._id || item.vessel })),
            totalAssets: result.totalAssets, blastRadius: result.blastRadius,
            summary: result.summary, simulatedBy: req.user.userId,
        });
        res.locals.auditResourceId = String(scenario._id);
        const populated = await SupplyChainScenario.findById(scenario._id).populate("supplier", "name supplierId").populate("affectedVessels.vessel", "name vesselId").lean();
        res.status(201).json({ success: true, message: "Supplier compromise simulation completed", scenario: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Supply-chain simulation failed" });
    }
};

const bootstrapDemo = async (req, res) => {
    try {
        const vessels = await Vessel.find({ isActive: true, ...vesselScope(req, "_id") }).select("_id name vesselId").lean();
        if (!vessels.length) return res.status(409).json({ success: false, message: "Create an accessible vessel before loading demo dependencies" });
        const definitions = [
            { supplierId: "SUP-NAVCORE", name: "NavCore Systems", category: "HARDWARE", baseRisk: 18, cves: [{ cveId: "CVE-2026-DEMO-1001", severity: "CRITICAL", cvssScore: 9.8, description: "Mock navigation gateway remote-code exposure" }] },
            { supplierId: "SUP-SATLINK", name: "SatLink Maritime", category: "SATELLITE", baseRisk: 12, cves: [{ cveId: "CVE-2026-DEMO-2001", severity: "MEDIUM", cvssScore: 6.5, description: "Mock terminal management weakness" }] },
            { supplierId: "SUP-OCEANSOFT", name: "OceanSoft Automation", category: "SOFTWARE", baseRisk: 8, cves: [] },
        ];
        const suppliers = [];
        for (const definition of definitions) {
            suppliers.push(await Supplier.findOneAndUpdate(
                { supplierId: definition.supplierId }, { $set: definition },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            ));
        }
        for (let vesselIndex = 0; vesselIndex < vessels.length; vesselIndex += 1) {
            const currentVessel = vessels[vesselIndex];
            const assetDefinitions = [
                { supplier: suppliers[0], suffix: "NAV", name: "Integrated Navigation Gateway", category: "NAVIGATION", model: "NC-Bridge-500", firmware: "4.2.1", criticality: "SAFETY_CRITICAL" },
                { supplier: suppliers[1], suffix: "SAT", name: "Satellite Communications Terminal", category: "SATELLITE", model: "SL-Ocean-X", firmware: "7.1.0", criticality: "OPERATIONAL" },
                ...(vesselIndex % 2 === 0 ? [{ supplier: suppliers[2], suffix: "AUTO", name: "Engine Automation Service", category: "SOFTWARE", model: "OceanControl", firmware: "3.8.0", criticality: "OPERATIONAL" }] : []),
            ];
            for (const definition of assetDefinitions) {
                await SupplyChainAsset.findOneAndUpdate(
                    { assetId: `DEMO-${currentVessel.vesselId}-${definition.suffix}` },
                    { $set: { vessel: currentVessel._id, supplier: definition.supplier._id, name: definition.name, category: definition.category, deviceModel: definition.model, firmwareVersion: definition.firmware, criticality: definition.criticality, operationalStatus: "ACTIVE", lastInventorySyncAt: new Date() } },
                    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
                );
            }
        }
        for (const supplier of suppliers) await recalculateSupplierRisk(supplier._id, req.app.get("io"));
        res.status(201).json({ success: true, message: `Demo dependency graph created for ${vessels.length} vessel(s)` });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to create demo dependency graph" });
    }
};

module.exports = { getFleetChokeOverview, createSupplier, updateSupplier, createAsset, updateAsset, simulateCompromise, bootstrapDemo };
