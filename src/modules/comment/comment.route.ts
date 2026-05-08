import { Router } from "express";
import { getComments, createComment, deleteComment } from "./comment.controller";
import { authenticate, optionalAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/:ideaId", optionalAuth, getComments);
router.post("/:ideaId", authenticate, createComment);
router.delete("/:id", authenticate, deleteComment);

export default router;
