import { getDb } from "./index";

const LOCAL_USER_ID = "local-user";

export type UserRow = {
  id: string;
  name: string;
  onboarding_completed: number;
  reminder_time: string;
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

export async function updateUser(data: {
  name?: string;
  onboarding_completed?: boolean;
  reminder_time?: string;
}) {
  const db = await getDb();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number)[] = [];

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

  fields.push("updated_at = ?");
  values.push(now);
  values.push(LOCAL_USER_ID);

  await db.runAsync(
    `UPDATE user SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
}
