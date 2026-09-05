const { Router } = require("express");
const {
  requestService,
  submitContact,
  subscribe
} = require("../controllers/formController.js");
const { requireFields } = require("../middleware/validate.js");

const router = Router();

router.post("/contact", requireFields(["name", "email", "message"]), submitContact);
router.post("/newsletter", requireFields(["email"]), subscribe);
router.post("/service-request", requireFields(["name", "email"]), requestService);

module.exports = router;
