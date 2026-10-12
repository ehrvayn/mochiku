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
  for (const col of [
    "title_confidence",
    "category_confidence",
    "deadline_confidence",
  ]) {
    if (!cols.some((c) => c.name === col)) {
      await db.execAsync(`ALTER TABLE items ADD COLUMN ${col} REAL`);
    }
  }
}
