import { Router } from "express";
import authRoutes from "../modules/auth/auth.route";
import ideaRoutes from "../modules/idea/idea.route";
import categoryRoutes from "../modules/category/category.route";
import voteRoutes from "../modules/vote/vote.route";
import commentRoutes from "../modules/comment/comment.route";
import paymentRoutes from "../modules/payment/payment.route";
import userRoutes from "../modules/user/user.route";
import adminRoutes from "../modules/admin/admin.route";
import newsletterRoutes from "../modules/newsletter/newsletter.route";
import uploadRoutes from "../modules/upload/upload.route";
import bookmarkRoutes from "../modules/bookmark/bookmark.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ideas", ideaRoutes);
router.use("/categories", categoryRoutes);
router.use("/votes", voteRoutes);
router.use("/comments", commentRoutes);
router.use("/payment", paymentRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/upload", uploadRoutes);
router.use("/bookmarks", bookmarkRoutes);

export default router;
