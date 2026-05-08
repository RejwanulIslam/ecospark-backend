import { Router } from "express";
import { voteOnIdea } from "./vote.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
router.post("/:ideaId", authenticate, voteOnIdea);

export default router;
