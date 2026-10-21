export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

/** Guards against a hand-edited route param before it reaches SQL. */
function normalizeMonthKey(key: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(key.trim());
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year > 1970 && month >= 1 && month <= 12) return match[0];
  }
  return currentMonthKey();
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const name = MONTH_NAMES[month - 1];
  if (!name || !Number.isFinite(year)) return key;
  return `${name} ${year}`;
}

/** First day of the month as YYYY-MM-DD, matching `expense_date`. */
export function monthStartKey(key: string): string {
  return `${normalizeMonthKey(key)}-01`;
}

/** First day of the following month, used as an exclusive upper bound. */
export function nextMonthStartKey(key: string): string {
  const normalized = normalizeMonthKey(key);
  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(5, 7));
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

/** "2026-10-15" -> "2026-10". */
export function monthOfDateKey(dateKey: string): string | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(dateKey);
  return match ? `${match[1]}-${match[2]}` : null;
}

/** Formats a local YYYY-MM-DD as "Oct 15". */
export function shortDateLabelFromKey(key: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return "";
  const month = Number(match[1]);
  const day = Number(match[2]);
  const name = MONTH_NAMES_SHORT[month - 1];
  return name ? `${name} ${day}` : "";
}
