import { Router } from "express";
import {
  getIdeas, getIdeaBySlug, createIdea, updateIdea,
  deleteIdea, submitForReview, getMyIdeas, getTopIdeas
} from "./idea.controller";
import { authenticate, optionalAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", getIdeas);
router.get("/top", getTopIdeas);
router.get("/my", authenticate, getMyIdeas);
router.get("/:slug", optionalAuth, getIdeaBySlug);
router.post("/", authenticate, createIdea);
router.put("/:id", authenticate, updateIdea);
router.delete("/:id", authenticate, deleteIdea);
router.post("/:id/submit", authenticate, submitForReview);

export default router;
