const express = require("express");
const controller = require("../controllers/intelligence.controller");
const { authenticate, authorizePermission } = require("../middleware/auth.middleware");
const { auditAction } = require("../middleware/audit.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const router = express.Router();

router.get("/", authenticate, authorizePermission(PERMISSIONS.THREAT_INTELLIGENCE_VIEW), controller.overview);
router.post("/indicators", authenticate, authorizePermission(PERMISSIONS.THREAT_INTELLIGENCE_MANAGE), auditAction("THREAT_INDICATOR_MANUAL_CREATE", "UNIFIED_THREAT_INDICATOR"), controller.createIndicator);
router.post("/reconcile", authenticate, authorizePermission(PERMISSIONS.THREAT_INTELLIGENCE_MANAGE), auditAction("THREAT_INTELLIGENCE_RECONCILE", "UNIFIED_THREAT_INDICATOR"), controller.reconcile);
router.post("/vessels/:vesselId/sync", authenticate, authorizePermission(PERMISSIONS.FLEET_LEARNING_MANAGE), auditAction("VESSEL_INTELLIGENCE_SYNC", "VESSEL"), controller.syncVessel);
router.post("/learning/candidates", authenticate, authorizePermission(PERMISSIONS.FLEET_LEARNING_MANAGE), auditAction("FLEET_MODEL_BUILD", "FLEET_MODEL"), controller.createCandidate);
router.post("/learning/:id/validate", authenticate, authorizePermission(PERMISSIONS.FLEET_LEARNING_MANAGE), auditAction("FLEET_MODEL_VALIDATE", "FLEET_MODEL"), controller.validate);
router.post("/learning/:id/activate", authenticate, authorizePermission(PERMISSIONS.FLEET_LEARNING_MANAGE), auditAction("FLEET_MODEL_ACTIVATE", "FLEET_MODEL"), controller.activate);
router.post("/learning/deployments/:id/rollback", authenticate, authorizePermission(PERMISSIONS.FLEET_LEARNING_MANAGE), auditAction("FLEET_MODEL_ROLLBACK", "VESSEL_MODEL_DEPLOYMENT"), controller.rollback);
router.post("/ml/train", authenticate, authorizePermission(PERMISSIONS.FLEET_LEARNING_MANAGE), auditAction("ML_MODEL_TRAIN", "ML_TRAINING_RUN"), controller.trainModel);
router.post("/ml/models/:id/infer", authenticate, authorizePermission(PERMISSIONS.FLEET_LEARNING_VIEW), controller.previewInference);
router.post("/compliance/reports", authenticate, authorizePermission(PERMISSIONS.REPORTS_EXPORT), auditAction("COMPLIANCE_REPORT_CREATE", "COMPLIANCE_REPORT"), controller.generateReport);
router.get("/compliance/reports/:id/:format", authenticate, authorizePermission(PERMISSIONS.REPORTS_EXPORT), controller.downloadReport);

module.exports = router;
