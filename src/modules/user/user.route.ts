import { Router } from "express";
import { getUserStats } from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
router.get("/stats", authenticate, getUserStats);

export default router;
