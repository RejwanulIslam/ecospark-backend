import { Router } from "express";
import multer from "multer";
import { uploadImage } from "./upload.controller";
import { authenticate } from "../../middleware/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

const router = Router();
router.post("/image", authenticate, upload.single("image"), uploadImage);

export default router;
