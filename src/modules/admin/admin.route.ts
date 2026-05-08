import { Router } from "express";
import {
  getAllIdeasAdmin, approveIdea, rejectIdea,
  getAllUsers, toggleUserStatus, updateUserRole, getDashboardStats
} from "./admin.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";

const router = Router();

// Apply admin middleware to all routes
router.use(authenticate, requireAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/ideas", getAllIdeasAdmin);
router.put("/ideas/:id/approve", approveIdea);
router.put("/ideas/:id/reject", rejectIdea);

router.get("/users", getAllUsers);
router.put("/users/:id/toggle-status", toggleUserStatus);
router.put("/users/:id/role", updateUserRole);

export default router;
