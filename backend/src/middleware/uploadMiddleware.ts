import multer from "multer";

/** Phone photos are a few MB; anything past this is abuse, not a receipt. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  // Without this, uploads land in memory unbounded.
  limits: { fileSize: MAX_FILE_BYTES },
});