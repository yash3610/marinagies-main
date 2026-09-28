const { Router } = require("express");
const {
  requestService,
  submitContact,
  subscribe
} = require("../controllers/formController.js");
const { requireFields } = require("../middleware/validate.js");
const rateLimit = require("../../middleware/rateLimit.js");

const router = Router();
const contactLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  key: (req) => "contact:" + req.ip
});

router.post("/contact", contactLimit, requireFields(["name", "email", "message"]), submitContact);
router.post("/newsletter", requireFields(["email"]), subscribe);
router.post("/service-request", requireFields(["name", "email"]), requestService);

module.exports = router;
