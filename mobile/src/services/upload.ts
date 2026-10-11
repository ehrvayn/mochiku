import { File } from "expo-file-system";
import { getItemById, saveExtractedData, getItemsByStatus } from "../db/items";
import { syncReminders } from "./notifications";

const API_URL = "http://192.168.1.9:3000";

export async function uploadPhoto(uri: string): Promise<any> {
  const file = new File(uri);

  const formData = new FormData();
  formData.append("photo", file, "photo.jpg");

  const response = await fetch(`${API_URL}/items/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return response.json();
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
  let succeeded = 0;
  for (const item of stuck) {
    const ok = await processItem(item.id);
    if (ok) succeeded++;
  }
  if (succeeded > 0) await syncReminders();
  return succeeded;
}
