import { File } from "expo-file-system";
import { getItemById, saveExtractedData, getItemsByStatus } from "../db/items";
import { syncReminders } from "./notifications";

const API_URL = "http://192.168.1.127:3000";
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
  constructor(code: UploadErrorCode) {
    super(code);
    this.name = "UploadError";
    this.code = code;
  }
}

const isUploadError = (e: unknown): e is UploadError =>
  typeof e === "object" &&
  e !== null &&
  (e as UploadError).name === "UploadError";

const MESSAGES: Record<UploadErrorCode, string> = {
  unreachable: "Can't reach the server. Saved to drafts, will retry later",
  timeout: "That took too long. Saved to drafts, will retry later",
  busy: "The reader is busy. Saved to drafts, will retry later",
  quota: "Daily scan limit reached. Saved to drafts, will retry later",
  server: "Something went wrong. Saved to drafts, will retry later",
  unknown: "Couldn't process that photo. Saved to drafts",
};

export const getUploadMessage = (e: unknown): string =>
  MESSAGES[isUploadError(e) ? e.code : "unknown"];

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
  if (!(await isServerUp())) throw new UploadError("unreachable");

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
        throw new UploadError("quota");
      }
      if (response.status === 503 || response.status === 429) {
        throw new UploadError("busy");
      }
      throw new UploadError("server");
    }

    return await response.json();
  } catch (err) {
    if (isUploadError(err)) throw err;
    if ((err as Error)?.name === "AbortError") throw new UploadError("timeout");
    if (err instanceof TypeError) throw new UploadError("unreachable");
    throw new UploadError("unknown");
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
  const stuck = await getItemsByStatus("uploaded");
  if (stuck.length === 0) return 0;
  if (!(await isServerUp())) return 0;

  let succeeded = 0;
  for (const item of stuck) {
    const ok = await processItem(item.id);
    if (ok) succeeded++;
  }
  if (succeeded > 0) await syncReminders();
  return succeeded;
}
