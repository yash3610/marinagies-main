const express = require("express");
const { getFleetChokeOverview, createSupplier, updateSupplier, createAsset, updateAsset, simulateCompromise, bootstrapDemo } = require("../controllers/fleetChoke.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");

const router = express.Router();
router.get("/", authenticate, authorizePermission(PERMISSIONS.FLEET_RISK_VIEW), getFleetChokeOverview);
router.post("/suppliers", authenticate, authorizePermission(PERMISSIONS.FLEET_RISK_MANAGE), auditAction("SUPPLIER_CREATE", "SUPPLIER"), createSupplier);
router.put("/suppliers/:id", authenticate, authorizePermission(PERMISSIONS.FLEET_RISK_MANAGE), auditAction("SUPPLIER_UPDATE", "SUPPLIER"), updateSupplier);
router.post("/assets", authenticate, authorizePermission(PERMISSIONS.FLEET_RISK_MANAGE), auditAction("SUPPLY_ASSET_CREATE", "SUPPLY_CHAIN_ASSET"), createAsset);
router.put("/assets/:id", authenticate, authorizePermission(PERMISSIONS.FLEET_RISK_MANAGE), auditAction("SUPPLY_ASSET_UPDATE", "SUPPLY_CHAIN_ASSET"), updateAsset);
router.post("/suppliers/:supplierId/simulate", authenticate, authorizePermission(PERMISSIONS.FLEET_RISK_MANAGE), auditAction("SUPPLIER_COMPROMISE_SIMULATE", "SUPPLY_CHAIN_SCENARIO"), simulateCompromise);
router.post("/bootstrap-demo", authenticate, authorizePermission(PERMISSIONS.FLEET_RISK_MANAGE), auditAction("SUPPLY_CHAIN_DEMO_BOOTSTRAP", "SUPPLY_CHAIN_ASSET"), bootstrapDemo);

module.exports = router;
