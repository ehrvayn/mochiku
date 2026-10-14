import { Router } from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { uploadRateLimit } from "../middleware/rateLimitMiddleware.js";
import { uploadItem } from "../controllers/itemsController.js";

const router = Router();

// Rate limit runs before multer so a flood is rejected without buffering the
// image into memory.
router.post("/upload", uploadRateLimit, upload.single("photo"), uploadItem);

export default router;