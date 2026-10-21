import { resolveExpenseDate } from "../utils/expenseDate";
import { pickAmountField } from "../utils/money";
import { monthStartKey, nextMonthStartKey } from "../utils/month";
import { Item } from "../types/item";
import { getDb } from "./index";

const EXPENSE_WHERE = "LOWER(i.category) IN ('bill', 'receipt')";

// Expense months are keyed by the date printed on the document, not by when
// the photo was saved.
const EXPENSE_ORDER = `COALESCE(i.expense_date, substr(i.created_at, 1, 10)) DESC,
     i.created_at DESC`;

export async function getExpenseItems(): Promise<Item[]> {
  const db = await getDb();
  return db.getAllAsync<Item>(
    `SELECT i.* FROM items i
     WHERE ${EXPENSE_WHERE} AND i.amount_minor IS NOT NULL
     ORDER BY ${EXPENSE_ORDER}`,
  );
}

export async function getExpenseItemsByMonth(month: string): Promise<Item[]> {
  await ensureExpenseData();
  const start = monthStartKey(month);
  const end = nextMonthStartKey(month);
  const db = await getDb();
  return db.getAllAsync<Item>(
    `SELECT i.* FROM items i
     WHERE ${EXPENSE_WHERE} AND i.amount_minor IS NOT NULL
       AND i.expense_date >= ? AND i.expense_date < ?
     ORDER BY ${EXPENSE_ORDER}`,
    [start, end],
  );
}

/** Items that look like an expense but whose amount never parsed. Surfaced in
 *  the UI so a total is never silently short. */
export async function countExpenseItemsMissingAmount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM items i
     WHERE ${EXPENSE_WHERE} AND i.amount_minor IS NULL`,
  );
  return row?.count ?? 0;
}

/** Counted items whose document had no readable date, so their month fell back
 *  to the day they were saved. Surfaced so the grouping can be questioned. */
export async function countExpenseItemsWithoutDocumentDate(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM items i
     WHERE ${EXPENSE_WHERE} AND i.amount_minor IS NOT NULL
       AND i.expense_date_source = 'created'`,
  );
  return row?.count ?? 0;
}

/** Re-derives `amount_minor` and the expense date from the item's fields.
 *  Called after extraction and after the user edits a field or deadline, so
 *  totals and months follow corrections. */
export async function syncItemExpenseData(itemId: string): Promise<void> {
  if (!itemId) return;
  const db = await getDb();
  const item = await db.getFirstAsync<{
    category: string | null;
    created_at: string;
    deadline_at: string | null;
  }>(
    "SELECT category, created_at, deadline_at FROM items WHERE id = ?",
    [itemId],
  );
  if (!item) return;

  const fields = await db.getAllAsync<{ key: string; value: string | null }>(
    "SELECT key, value FROM item_fields WHERE item_id = ?",
    [itemId],
  );

  const amount = pickAmountField(fields);
  const resolved = resolveExpenseDate({
    category: item.category,
    fields,
    deadlineAt: item.deadline_at,
    createdAt: item.created_at,
  });

  await db.runAsync(
    `UPDATE items
     SET amount_minor = ?, expense_date = ?, expense_date_source = ?
     WHERE id = ?`,
    [amount, resolved?.date ?? null, resolved?.source ?? null, itemId],
  );
}

let backfillPromise: Promise<void> | null = null;

/** One-time-per-launch backfill for rows that predate the derived columns. The
 *  promise is cached so every screen focus does not rescan the table. */
export function ensureExpenseData(): Promise<void> {
  if (!backfillPromise) {
    backfillPromise = backfillExpenseData().catch((error) => {
      backfillPromise = null;
      throw error;
    });
  }
  return backfillPromise;
}

async function backfillExpenseData(): Promise<void> {
  const db = await getDb();
  const items = await db.getAllAsync<{
    id: string;
    category: string | null;
    created_at: string;
    deadline_at: string | null;
  }>(
    `SELECT i.id AS id, i.category AS category, i.created_at AS created_at,
            i.deadline_at AS deadline_at
     FROM items i
     WHERE ${EXPENSE_WHERE}
       AND (i.amount_minor IS NULL OR i.expense_date IS NULL)`,
  );

  if (items.length === 0) return;

  // Load every field row in one pass. Items with no fields still need their
  // date set (to the saved date), so the field map is allowed to be empty.
  const fieldsByItem = new Map<
    string,
    { key: string; value: string | null }[]
  >();
  for (const item of items) fieldsByItem.set(item.id, []);

  const ids = items.map((item) => item.id);
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = await db.getAllAsync<{
      item_id: string;
      key: string;
      value: string | null;
    }>(
      `SELECT item_id, key, value FROM item_fields
       WHERE item_id IN (${placeholders})`,
      chunk,
    );
    for (const row of rows) fieldsByItem.get(row.item_id)?.push(row);
  }

  for (const item of items) {
    const fields = fieldsByItem.get(item.id) ?? [];
    const amount = pickAmountField(fields);
    const resolved = resolveExpenseDate({
      category: item.category,
      fields,
      deadlineAt: item.deadline_at,
      createdAt: item.created_at,
    });

    // Deliberately not wrapped in a transaction: a partially finished backfill
    // is harmless (the remaining rows are retried next launch), while a
    // non-exclusive transaction could swallow a concurrent upload.
    await db.runAsync(
      `UPDATE items
       SET amount_minor = ?, expense_date = ?, expense_date_source = ?
       WHERE id = ?`,
      [amount, resolved?.date ?? null, resolved?.source ?? null, item.id],
    );
  }
}
