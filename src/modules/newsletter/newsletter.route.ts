import { Router } from "express";
import { subscribe, unsubscribe } from "./newsletter.controller";
import { optionalAuth } from "../../middleware/auth.middleware";

const router = Router();
router.post("/subscribe", optionalAuth, subscribe);
router.post("/unsubscribe", unsubscribe);

export default router;
