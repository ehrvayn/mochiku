import { File } from "expo-file-system";
import { getItemById, saveExtractedData, getItemsByStatus } from "../db/items";
import {
  getActiveCooldown,
  recordUploadFailure,
  recordUploadSuccess,
} from "./cooldown";
import { syncReminders } from "./notifications";

const API_URL = "http://192.168.1.6:3000";
const UPLOAD_TIMEOUT_MS = 20000;

export type UploadErrorCode =
  | "unreachable"
  | "timeout"
  | "busy"
  | "quota"
  | "server"
  | "unknown";

export class UploadError extends Error {
  code: UploadErrorCode;
  /** Provider-supplied hint for how long its rate-limit window lasts. */
  retryAfterMs?: number;
  constructor(code: UploadErrorCode, retryAfterMs?: number) {
    super(code);
    this.name = "UploadError";
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

const isUploadError = (e: unknown): e is UploadError =>
  typeof e === "object" &&
  e !== null &&
  (e as UploadError).name === "UploadError";

/** Feed the backoff tracker, then rethrow unchanged so callers see the code. */
const record = (error: UploadError): UploadError => {
  recordUploadFailure(error.code, error.retryAfterMs);
  return error;
};

/** Every message states the reason first, then what happened to the photo. */
const MESSAGES: Record<UploadErrorCode, string> = {
  unreachable:
    "Can't reach the server right now. Saved to drafts — we'll read it when you're back online.",
  timeout:
    "That took too long to read. Saved to drafts — we'll give it another go shortly.",
  busy: "The reader's busy right now. Saved to drafts — we'll pick it up shortly.",
  quota:
    "You've used today's reading allowance. Saved to drafts — they'll come through once it resets.",
  server:
    "Something went wrong reading that. Saved to drafts — we'll try it again shortly.",
  unknown: "Couldn't read that photo. Saved to drafts — we'll take another look later.",
};

export const getUploadMessage = (e: unknown): string =>
  MESSAGES[isUploadError(e) ? e.code : "unknown"];

/** Pull the provider's reset hint off a rate-limit response, if it sent one. */
const readRetryAfterMs = (response: Response): number | undefined => {
  const direct = response.headers.get("retry-after");
  const groqStyle =
    response.headers.get("x-ratelimit-reset-requests") ??
    response.headers.get("x-ratelimit-reset-tokens");
  const value = direct ?? groqStyle;
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;

  const match = value.match(/^(\d+)h(\d+)m(\d+)s$/) ?? value.match(/^(\d+)m(\d+)s$/);
  if (!match) return undefined;
  if (match.length === 4) {
    const [, h, m, s] = match;
    return (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000;
  }
  const [, m, s] = match;
  return (Number(m) * 60 + Number(s)) * 1000;
};

export async function isServerUp(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) return false;

    const data = await response.json();
    return data?.running === true;
  } catch {
    return false;
  }
}

export async function uploadPhoto(uri: string): Promise<any> {
  if (!(await isServerUp())) throw record(new UploadError("unreachable"));

  const file = new File(uri);

  const formData = new FormData();
  formData.append("photo", file, "photo.jpg");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/items/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      if (body?.status === "failed: quota exceeded") {
        throw record(new UploadError("quota"));
      }
      if (response.status === 503 || response.status === 429) {
        throw record(new UploadError("busy", readRetryAfterMs(response)));
      }
      throw record(new UploadError("server"));
    }

    const data = await response.json();
    recordUploadSuccess();
    return data;
  } catch (err) {
    if (isUploadError(err)) throw err;
    if ((err as Error)?.name === "AbortError") throw record(new UploadError("timeout"));
    if (err instanceof TypeError) throw record(new UploadError("unreachable"));
    throw record(new UploadError("unknown"));
  } finally {
    clearTimeout(timer);
  }
}

export async function processItem(itemId: string): Promise<boolean> {
  const item = await getItemById(itemId);
  if (!item) return false;

  try {
    const result = await uploadPhoto(item.local_image_uri);
    if (!result.ok) return false;
    await saveExtractedData(itemId, result.extracted);
    return true;
  } catch {
    return false;
  }
}

export async function processPendingUploads(): Promise<number> {
  // A rate-limit streak is being backed off on purpose. Skip the whole pass
  // rather than letting the poller spend the cooldown still failing.
  if (getActiveCooldown()) return 0;

  const stuck = await getItemsByStatus("uploaded");
  if (stuck.length === 0) return 0;
  if (!(await isServerUp())) return 0;

  let succeeded = 0;
  for (const item of stuck) {
    // Re-check each iteration: the first item may have tripped the cooldown.
    if (getActiveCooldown()) break;
    const ok = await processItem(item.id);
    if (ok) succeeded++;
  }
  if (succeeded > 0) await syncReminders();
  return succeeded;
}
