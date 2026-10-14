/**
 * Token bucket rate limiting for the upload endpoint.
 *
 * Groq's own limits are a ceiling, not a floor: they are account-wide, so an
 * abusive client doesn't get blocked, every legitimate user sharing the account
 * does. This sits in front of that and stops the flood before it becomes your
 * problem.
 *
 * Design goal is that a normal user is never throttled. The bucket holds a large
 * burst and refills faster than any human snaps photos, so real traffic drains
 * it slower than it refills and never hits the wall. Only pathological bursts
 * (hundreds of requests in seconds) can empty it.
 *
 * In-memory by design: single process, no new dependencies. If this ever runs
 * as more than one instance, buckets stop being shared and this needs a shared
 * store.
 */

type Bucket = {
  /** Remaining allowance. */
  tokens: number;
  /** Epoch ms when the bucket last refilled. */
  updatedAt: number;
};

const buckets = new Map<string, Bucket>();

/** Sweep so the map cannot grow without bound. */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const IDLE_EVICTION_MS = 60 * 60 * 1000;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.updatedAt > IDLE_EVICTION_MS) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

// Never hold the process open just to evict buckets.
cleanupTimer.unref?.();

export type RateLimitConfig = {
  /** Tokens available before any throttling begins. */
  burst: number;
  /** Tokens added per window, as a fraction-per-window rate. */
  refillPerMinute: number;
  /** Length of the refill window in ms. */
  windowMs: number;
};

/**
 * Burst is generous on purpose. A user catching up on a backlog of drafts, or
 * snapping a stack of receipts in one sitting, should never notice this exists.
 * The refill rate is what catches a sustained flood.
 */
export const CLIENT_LIMIT: RateLimitConfig = {
  burst: 30,
  refillPerMinute: 6,
  windowMs: 60_000,
};

/**
 * Per-IP is a loose backstop only, set several times higher than the per-client
 * limit. Mobile carriers put many users behind one address (CGNAT), so this
 * must stay high enough that shared-IP legitimate traffic never reaches it. It
 * exists to catch one client cycling through fresh client IDs, not to police
 * ordinary use.
 */
export const IP_LIMIT: RateLimitConfig = {
  burst: 200,
  refillPerMinute: 40,
  windowMs: 60_000,
};

/**
 * Smallest wait we will report. The exact time until the next token accrues can
 * be a few hundred ms, which is technically accurate but useless to a client and
 * invites a hot retry loop. Rounding up is deliberately conservative: waiting a
 * little longer than necessary is always safe here.
 */
const MIN_RETRY_MS = 1000;

/**
 * Spend one token. Returns the wait in ms before a request would be allowed,
 * or 0 if it is permitted.
 */
export function consume(key: string, config: RateLimitConfig): number {
  const now = Date.now();
  const refillRate = config.refillPerMinute / (config.windowMs / 60_000);
  const maxTokens = config.burst;

  const existing = buckets.get(key);
  const bucket: Bucket = existing ?? { tokens: maxTokens, updatedAt: now };

  if (existing) {
    const elapsed = now - existing.updatedAt;
    bucket.tokens = Math.min(
      maxTokens,
      existing.tokens + elapsed * refillRate,
    );
    bucket.updatedAt = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return 0;
  }

  buckets.set(key, bucket);
  // Time until one whole token has accrued back.
  const deficit = 1 - bucket.tokens;
  return Math.max(MIN_RETRY_MS, Math.ceil(deficit / refillRate));
}

/** Clear all buckets. Exposed for tests. */
export function resetBuckets() {
  buckets.clear();
}
