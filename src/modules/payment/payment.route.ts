import { Router } from "express";
import {
  createPaymentIntent, confirmPayment, checkPurchase,
  getMyPurchases, stripeWebhook
} from "./payment.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post("/create-intent", authenticate, createPaymentIntent);
router.post("/confirm", authenticate, confirmPayment);
router.get("/purchases", authenticate, getMyPurchases);
router.get("/check/:ideaId", authenticate, checkPurchase);

// Webhook needs raw body, we'll mount it directly in index.ts or keep it here if index.ts handles raw body properly
router.post("/webhook", stripeWebhook);

export default router;
