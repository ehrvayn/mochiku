import { randomUUID } from "expo-crypto";
import { getDb } from "./index";
import { Item, ItemStatus, ExtractedData, ItemField } from "../types/item";

export async function insertItem(uri: string): Promise<string> {
  const db = await getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO items (id, local_image_uri, status, sync_status, created_at, updated_at)
     VALUES (?, ?, 'uploaded', 'pending', ?, ?)`,
    [id, uri, now, now],
  );

  return id;
}

export async function getItemsByStatus(status: ItemStatus): Promise<Item[]> {
  const db = await getDb();
  return db.getAllAsync<Item>(
    "SELECT * FROM items WHERE status = ? ORDER BY created_at DESC",
    [status],
  );
}

export async function getAllItems(): Promise<Item[]> {
  const db = await getDb();
  return db.getAllAsync<Item>("SELECT * FROM items ORDER BY created_at DESC");
}

export async function getItemFields(itemId: string): Promise<ItemField[]> {
  if (!itemId) return [];
  const db = await getDb();
  return db.getAllAsync<ItemField>(
    "SELECT * FROM item_fields WHERE item_id = ?",
    [itemId],
  );
}

export async function getUpcomingItems(): Promise<Item[]> {
  const db = await getDb();
  return db.getAllAsync<Item>(
    `SELECT * FROM items
     WHERE status = 'confirmed' AND deadline_confirmed_at IS NOT NULL
       AND mark_as_done = 0
     ORDER BY deadline_at ASC`,
  );
}

export async function getItemById(id: string): Promise<Item | null> {
  if (!id) return null;
  const db = await getDb();
  return db.getFirstAsync<Item>("SELECT * FROM items WHERE id = ?", [id]);
}

export async function saveExtractedData(
  itemId: string,
  extracted: ExtractedData,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const REVIEW_BELOW = 0.7;
  const deadline = extracted.deadline.value;
  const needsReview =
    deadline !== null && extracted.deadline.confidence < REVIEW_BELOW;

  const status = !deadline
    ? "stored"
    : needsReview
      ? "pending_review"
      : "confirmed";
  const confirmedAt = status === "confirmed" ? now : null;

  await db.runAsync(
    `UPDATE items
     SET category = ?, category_confidence = ?,
         title = ?, title_confidence = ?,
         deadline_at = ?, deadline_confidence = ?,
         status = ?, deadline_confirmed_at = ?, updated_at = ?
     WHERE id = ?`,
    [
      extracted.category.value,
      extracted.category.confidence,
      extracted.title.value,
      extracted.title.confidence,
      deadline,
      extracted.deadline.confidence,
      status,
      confirmedAt,
      now,
      itemId,
    ],
  );

  for (const [key, field] of Object.entries(extracted.fields)) {
    await db.runAsync(
      `INSERT INTO item_fields (item_id, key, value, confidence, user_edited)
       VALUES (?, ?, ?, ?, 0)`,
      [itemId, key, field.value, field.confidence],
    );
  }
}

export async function markItemsDone(
  itemIds: string[],
  value: boolean,
): Promise<void> {
  if (itemIds.length === 0) return;
  const db = await getDb();
  const placeholders = itemIds.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE items SET mark_as_done = ?, updated_at = ? WHERE id IN (${placeholders})`,
    [value ? 1 : 0, new Date().toISOString(), ...itemIds],
  );
}

export async function updateItemStatus(
  itemId: string,
  status: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE items SET status = ?, updated_at = ? WHERE id = ?`,
    [status, new Date().toISOString(), itemId],
  );
}

export async function confirmItem(itemId: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE items SET status = 'confirmed', deadline_confirmed_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, itemId],
  );
}

export async function updateItem(
  itemId: string,
  itemData: { title: string | null; deadline: string | null },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE items SET title = ?, deadline_at = ?, updated_at = ? WHERE id = ?`,
    [itemData.title, itemData.deadline, new Date().toISOString(), itemId],
  );
}

export async function updateItemField(
  fieldId: number,
  value: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE item_fields SET value = ?, user_edited = 1 WHERE id = ?`,
    [value, fieldId],
  );
}

export async function deleteItem(itemId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM items WHERE id = ?`, [itemId]);
}

export async function deleteItems(itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return;
  const db = await getDb();
  const placeholders = itemIds.map(() => "?").join(",");
  await db.runAsync(`DELETE FROM items WHERE id IN (${placeholders})`, itemIds);
}

/** Drives every scheduled reminder. `runSync` cancels all pending
 *  notifications before rescheduling from this list, so filtering done items
 *  out here is what actually stops them from firing. */
export async function getRemindableItems(): Promise<Item[]> {
  const db = await getDb();
  return db.getAllAsync<Item>(
    `SELECT * FROM items
     WHERE status IN ('stored', 'confirmed') AND deadline_at IS NOT NULL
       AND mark_as_done = 0
     ORDER BY deadline_at ASC`,
  );
}
