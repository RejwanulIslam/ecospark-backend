import { Router } from "express";
import {
  toggleBookmark,
  getMyBookmarks,
  checkBookmark,
  getBookmarkedIds,
} from "./bookmark.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post("/:ideaId", authenticate, toggleBookmark);
router.get("/", authenticate, getMyBookmarks);
router.get("/ids", authenticate, getBookmarkedIds);
router.get("/check/:ideaId", authenticate, checkBookmark);

export default router;
