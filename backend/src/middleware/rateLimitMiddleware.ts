import type { NextFunction, Request, Response } from "express";
import {
  CLIENT_LIMIT,
  consume,
  type RateLimitConfig,
  IP_LIMIT,
} from "../services/rateLimit.js";

/** Header the app uses to identify itself. Self-reported, not authenticated. */
export const CLIENT_ID_HEADER = "x-client-id";

/**
 * Read the client id. Anything at all is accepted as a bucket key: this is a
 * fair-usage guard, not an authentication boundary, and validating the shape
 * only makes it easier to probe.
 */
const clientKey = (req: Request) => {
  const header = req.get(CLIENT_ID_HEADER);
  return header && header.length <= 64 ? `client:${header}` : null;
};

/** Behind a proxy/load balancer, trust the forwarded address. */
const ipKey = (req: Request) => `ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`;

/**
 * 503 rather than 429 on purpose.
 *
 * The mobile client already maps 503 to its "busy" code, which drives the
 * backoff and cooldown logic built around the VLM's own rate limit. Reusing it
 * means abuse throttling and provider throttling are indistinguishable to the
 * client: one code path, existing copy, no new error state to design for.
 */
const throttle = (res: Response, retryAfterMs: number) => {
  const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.set("Retry-After", String(retryAfterSec));
  res.status(503).json({
    ok: false,
    error: "Too many requests",
    status: "failed: service busy",
    retryable: true,
  });
};

const check = (
  req: Request,
  res: Response,
  key: string,
  config: RateLimitConfig,
): boolean => {
  const retryAfterMs = consume(key, config);
  if (retryAfterMs > 0) {
    throttle(res, retryAfterMs);
    return false;
  }
  return true;
};

/**
 * Per-client limit with a loose per-IP backstop.
 *
 * A client that presents an id is judged on that id alone. Without one, we fall
 * back to the address, which is the only identity available.
 */
export function uploadRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = clientKey(req);

  if (key) {
    if (!check(req, res, key, CLIENT_LIMIT)) return;
  } else if (!check(req, res, ipKey(req), IP_LIMIT)) {
    return;
  }

  // Backstop for a single client cycling through fresh ids. Deliberately far
  // above CLIENT_LIMIT so shared-IP carrier traffic never reaches it.
  if (!check(req, res, ipKey(req), IP_LIMIT)) return;

  next();
}
