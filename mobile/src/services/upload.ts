import { File } from "expo-file-system";
import { getItemById, saveExtractedData, getItemsByStatus } from "../db/items";
import {
  getActiveCooldown,
  recordUploadFailure,
  recordUploadSuccess,
} from "./cooldown";
import { getClientId } from "./photos";
import { syncReminders } from "./notifications";

const API_URL = "http://192.168.1.8:3000";
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

const record = (error: UploadError): UploadError => {
  recordUploadFailure(error.code, error.retryAfterMs);
  return error;
};

const MESSAGES: Record<UploadErrorCode, string> = {
  unreachable: "Can't reach the server. Saved to drafts.",
  timeout: "Took too long to read. Saved to drafts.",
  busy: "The reader's busy. Saved to drafts.",
  quota: "The reader hit its limit. Saved to drafts.",
  server: "Couldn't read that. Saved to drafts.",
  unknown: "Couldn't read that. Saved to drafts.",
};

export const getUploadMessage = (e: unknown): string =>
  MESSAGES[isUploadError(e) ? e.code : "unknown"];

const readRetryAfterMs = (response: Response): number | undefined => {
  const direct = response.headers.get("retry-after");
  const groqStyle =
    response.headers.get("x-ratelimit-reset-requests") ??
    response.headers.get("x-ratelimit-reset-tokens");
  const value = direct ?? groqStyle;
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;

  const match =
    value.match(/^(\d+)h(\d+)m(\d+)s$/) ?? value.match(/^(\d+)m(\d+)s$/);
  if (!match) return undefined;
  if (match.length === 4) {
    const [, h, m, s] = match;
    return (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000;
  }
  const [, m, s] = match;
  return (Number(m) * 60 + Number(s)) * 1000;
};

/**
 * Health check timeout.
 *
 * A free-tier host suspends idle instances and takes up to a minute to wake.
 * Without a cap this fetch hangs for that whole window and the user watches
 * "Reading your photo..." doing nothing, so fail fast instead: a false here
 * just means the photo waits in drafts, which the poller picks up for free.
 */
const HEALTH_TIMEOUT_MS = 4000;

/** Probe the server in the background so the next capture finds it awake. */
let warmup: Promise<boolean> | null = null;

export function warmServer(): void {
  if (warmup) return;
  warmup = isServerUp().finally(() => {
    warmup = null;
  });
}

export async function isServerUp(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
    });
    if (!response.ok) return false;

    const data = await response.json();
    return data?.running === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
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
      headers: { "x-client-id": getClientId() },
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
    if ((err as Error)?.name === "AbortError")
      throw record(new UploadError("timeout"));
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
  if (getActiveCooldown()) return 0;

  const stuck = await getItemsByStatus("uploaded");
  if (stuck.length === 0) return 0;
  if (!(await isServerUp())) return 0;

  let succeeded = 0;
  for (const item of stuck) {
    if (getActiveCooldown()) break;
    const ok = await processItem(item.id);
    if (ok) succeeded++;
  }
  if (succeeded > 0) await syncReminders();
  return succeeded;
}
