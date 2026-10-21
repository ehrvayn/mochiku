import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("mochiku.db");
      await migrate(db);
      return db;
    })().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      reminder_time TEXT NOT NULL DEFAULT '09:00',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      local_image_uri TEXT NOT NULL,
      category TEXT,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'uploaded',
      deadline_at TEXT,
      deadline_confirmed_at TEXT,
      mark_as_done INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS item_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      confidence REAL,
      user_edited INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
  `);

  const cols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(items)",
  );
  // CREATE TABLE IF NOT EXISTS above is a no-op on databases created by an
  // older build, so every column added after the first release has to be
  // backfilled here with ALTER TABLE.
  const additions: Array<[string, string]> = [
    ["title_confidence", "REAL"],
    ["category_confidence", "REAL"],
    ["deadline_confidence", "REAL"],
    ["mark_as_done", "INTEGER NOT NULL DEFAULT 0"],
    // Derived from item_fields so the Expenses tab can sum and group without
    // joining every field row. Keep them in sync via syncItemExpenseData().
    ["amount_minor", "INTEGER"],
    // The date printed on the document (local YYYY-MM-DD). Expense months are
    // grouped by this, not by when the photo was saved.
    ["expense_date", "TEXT"],
    // 'extracted' or 'created', so the UI can flag saved-date fallbacks.
    ["expense_date_source", "TEXT"],
  ];
  for (const [col, type] of additions) {
    if (!cols.some((c) => c.name === col)) {
      await db.execAsync(`ALTER TABLE items ADD COLUMN ${col} ${type}`);
    }
  }

  // Created after the ALTER above, because old databases only grow the column
  // in this pass.
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_items_expense_date ON items(expense_date)",
  );

  const userCols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(user)",
  );
  // notify_categories: JSON array of category labels that may raise a
  // reminder. NULL means "every category", which is what an untouched row
  // should keep meaning. mascot_lang is scoped to the mascot's speech only.
  const userAdditions: Array<[string, string]> = [
    ["notify_categories", "TEXT"],
    ["mascot_lang", "TEXT NOT NULL DEFAULT 'en'"],
  ];
  for (const [col, type] of userAdditions) {
    if (!userCols.some((c) => c.name === col)) {
      await db.execAsync(`ALTER TABLE user ADD COLUMN ${col} ${type}`);
    }
  }
}
