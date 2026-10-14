import type { Request, Response } from "express";
import { extractDataFromImage, retryAfterMs } from "../services/extractionService.js";

export async function uploadItem(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No photo received" });
  }

  try {
    const extracted = await extractDataFromImage(
      req.file.buffer,
      req.file.mimetype,
    );
    console.log("Extracted:", extracted);
    res.json({ ok: true, extracted });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    console.error("Extraction failed after retries:", err);

    if (status === 503 || status === 429) {
      // Hand the client the provider's reset window so its backoff matches the
      // actual rate-limit window instead of assuming one.
      const waitMs = retryAfterMs(err);
      if (waitMs) res.set("Retry-After", String(Math.ceil(waitMs / 1000)));
      return res.status(503).json({
        ok: false,
        error: "Extraction failed",
        status: "failed: service busy",
        retryable: true,
        retryAfterMs: waitMs,
      });
    }

    res
      .status(500)
      .json({ ok: false, error: "Extraction failed", status: "failed" });
  }
}
