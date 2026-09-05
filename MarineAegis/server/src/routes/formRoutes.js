import { Router } from "express";
import {
  requestService,
  submitContact,
  subscribe
} from "../controllers/formController.js";
import { requireFields } from "../middleware/validate.js";

const router = Router();

router.post("/contact", requireFields(["name", "email", "message"]), submitContact);
router.post("/newsletter", requireFields(["email"]), subscribe);
router.post("/service-request", requireFields(["name", "email"]), requestService);

export default router;
