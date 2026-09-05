import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { requireFields } from "../middleware/validate.js";

const router = Router();

router.post("/register", requireFields(["name", "email", "password"]), register);
router.post("/login", requireFields(["email", "password"]), login);

export default router;
