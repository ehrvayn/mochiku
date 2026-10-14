import Storage from "expo-sqlite/kv-store";
import type { UploadErrorCode } from "./upload";

/**
 * Upload backoff.
 *
 * Every failed capture is already durable in SQLite by the time the network
 * call happens, so a failure is never a lost photo — it is a draft waiting to
 * be read. That means we can afford to give up quickly instead of holding a
 * request open against a rate-limited provider.
 *
 * When the same rate-limit-shaped failure repeats a few times in a row we stop
 * trying altogether for a while, and the UI explains why rather than silently
 * doing nothing. Connectivity and server bugs are deliberately excluded: those
 * are real problems the user or developer needs to see immediately.
 */

/** Failures that mean "back off", as opposed to "something is wrong". */
const COOLDOWN_CODES: readonly UploadErrorCode[] = ["busy", "quota", "timeout"];

/** Consecutive failures of the same code before we stop trying. */
const MAX_CONSECUTIVE_FAILURES = 3;

/** Used when the provider does not tell us when its window resets. */
const FALLBACK_COOLDOWN_MS = 60 * 60 * 1000;

/** Never wait longer than this, even if a provider asks for more. */
const MAX_COOLDOWN_MS = 60 * 60 * 1000;

const STORAGE_KEY = "upload_cooldown_v1";

type CooldownEntry = { failures: number; until: number };

type CooldownState = Partial<Record<UploadErrorCode, CooldownEntry>>;

const isCooldownCode = (code: UploadErrorCode) =>
  COOLDOWN_CODES.includes(code);

/** Read-modify-write stays synchronous, so it cannot interleave with itself. */
const read = (): CooldownState => {
  const raw = Storage.getItemSync(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CooldownState;
  } catch {
    return {};
  }
};

const write = (state: CooldownState) => {
  Storage.setItemSync(STORAGE_KEY, JSON.stringify(state));
};

const clamp = (ms: number) => Math.max(0, Math.min(ms, MAX_COOLDOWN_MS));

/**
 * Providers express the reset window in a few shapes: a plain number of
 * seconds, or a compact duration like "1m30s". Accept both.
 */
const parseDurationMs = (value: string): number | null => {
  const seconds = Number(value);
  if (Number.isFinite(seconds) && value.trim() !== "") {
    return seconds * 1000;
  }

  const match = value.match(/^(\d+)h(\d+)m(\d+)s$/i) ?? value.match(/^(\d+)m(\d+)s$/i);
  if (!match) return null;

  if (match.length === 4) {
    const [, h, m, s] = match;
    return (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000;
  }

  const [, m, s] = match;
  return (Number(m) * 60 + Number(s)) * 1000;
};

/** Milliseconds remaining before uploads are allowed again, 0 if ready. */
export function getCooldownRemaining(code: UploadErrorCode): number {
  if (!isCooldownCode(code)) return 0;
  const entry = read()[code];
  if (!entry) return 0;
  const remaining = entry.until - Date.now();
  if (remaining <= 0) {
    // Window elapsed. Clear it so the next failure starts a fresh streak
    // instead of tripping the threshold again on a single hiccup.
    clearCooldown(code);
    return 0;
  }
  return remaining;
}

/** Cooldown that is currently blocking, preferring the longest wait. */
export function getActiveCooldown(): { code: UploadErrorCode; remaining: number } | null {
  let best: { code: UploadErrorCode; remaining: number } | null = null;
  for (const code of COOLDOWN_CODES) {
    const remaining = getCooldownRemaining(code);
    if (remaining > 0 && (!best || remaining > best.remaining)) {
      best = { code, remaining };
    }
  }
  return best;
}

export function clearCooldown(code?: UploadErrorCode) {
  const state = read();
  if (code) delete state[code];
  else for (const key of Object.keys(state) as UploadErrorCode[]) delete state[key];
  write(state);
}

/**
 * Note a failed upload. Codes outside the cooldown set are ignored entirely
 * so a flaky connection never mutes a working provider.
 */
export function recordUploadFailure(code: UploadErrorCode, retryAfterMs?: number) {
  if (!isCooldownCode(code)) return;

  const state = read();
  const previous = state[code] ?? { failures: 0, until: 0 };
  const failures = previous.failures + 1;

  if (failures < MAX_CONSECUTIVE_FAILURES) {
    state[code] = { failures, until: 0 };
    write(state);
    return;
  }

  const wait = clamp(retryAfterMs && retryAfterMs > 0 ? retryAfterMs : FALLBACK_COOLDOWN_MS);
  state[code] = { failures, until: Date.now() + wait };
  write(state);
}

/** Any success clears the streak: the provider is healthy again. */
export function recordUploadSuccess() {
  clearCooldown();
}

const humanizeDuration = (ms: number) => {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "a moment";
  if (minutes === 1) return "about a minute";
  if (minutes < 60) return `about ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "about an hour" : `about ${hours} hours`;
};

/** Copy shown when an upload is refused because we are backing off. */
export function getCooldownMessage(code: UploadErrorCode, remaining: number) {
  const wait = humanizeDuration(remaining);
  switch (code) {
    case "quota":
      return `The reader hit its limit. Saved to drafts — we'll retry in ${wait}.`;
    case "timeout":
      return `The reader's struggling. Saved to drafts — we'll retry in ${wait}.`;
    default:
      return `The reader's busy, so we're waiting. Saved to drafts — we'll retry in ${wait}.`;
  }
}
