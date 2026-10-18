import { getDb } from "./index";
import type { MascotLang } from "../constants/i18n";

const LOCAL_USER_ID = "local-user";

export type UserRow = {
  id: string;
  name: string;
  onboarding_completed: number;
  reminder_time: string;
  notify_categories: string | null;
  mascot_lang: MascotLang;
  created_at: string;
  updated_at: string;
};

export async function getUser() {
  const db = await getDb();
  return db.getFirstAsync<UserRow>(
    "SELECT * FROM user WHERE id = ?",
    [LOCAL_USER_ID],
  );
}

export async function ensureLocalUser(defaultName: string = "Friend") {
  const db = await getDb();
  const existing = await getUser();
  if (existing) return existing;

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO user (id, name, onboarding_completed, reminder_time, created_at, updated_at)
     VALUES (?, ?, 0, '09:00', ?, ?)`,
    [LOCAL_USER_ID, defaultName, now, now],
  );
  return getUser();
}

/** Which categories may raise a reminder. `null` means every category, which
 *  is what a user who has never touched the setting should get. */
export function parseNotifyCategories(raw: string | null | undefined) {
  if (raw === null || raw === undefined || raw === "") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return null;
  }
}

export async function updateUser(data: {
  name?: string;
  onboarding_completed?: boolean;
  reminder_time?: string;
  notify_categories?: string[] | null;
  mascot_lang?: MascotLang;
}) {
  const db = await getDb();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.onboarding_completed !== undefined) {
    fields.push("onboarding_completed = ?");
    values.push(data.onboarding_completed ? 1 : 0);
  }
  if (data.reminder_time !== undefined) {
    fields.push("reminder_time = ?");
    values.push(data.reminder_time);
  }
  if (data.notify_categories !== undefined) {
    fields.push("notify_categories = ?");
    values.push(
      data.notify_categories === null
        ? null
        : JSON.stringify(data.notify_categories),
    );
  }
  if (data.mascot_lang !== undefined) {
    fields.push("mascot_lang = ?");
    values.push(data.mascot_lang);
  }

  fields.push("updated_at = ?");
  values.push(now);
  values.push(LOCAL_USER_ID);

  await db.runAsync(
    `UPDATE user SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
}
