/**
 * Picks the date an expense belongs to.
 *
 * The month a bill or receipt counts toward is the date printed on the
 * document, not the day the photo was saved. `created_at` is only a fallback
 * for documents whose date could not be read, and the UI flags those so a
 * total is never silently placed in the wrong month.
 *
 * Bills use the due date first (that is when the money leaves), then the
 * bill/statement date, then any other date field. Receipts use the receipt or
 * transaction date. Both fall back to the saved date.
 */

import type { ExpenseDateSource } from "../types/item";

export type ResolvedExpenseDate = {
  /** Local calendar date as YYYY-MM-DD, so months can be compared as text. */
  date: string;
  source: ExpenseDateSource;
};

type FieldLike = { key: string; value: string | null };

type DateParts = { year: number; month: number; day: number };

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MONTH_PATTERN =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;

// Priority order within a tier. Longer, more specific keys first so
// "payment_due_date" wins over a bare "due".
const DUE_KEYS = [
  "payment_due_date",
  "amount_due_date",
  "date_due",
  "due_date",
  "payment_due",
  "due_on",
  "due",
];

const BILL_DATE_KEYS = [
  "bill_date",
  "statement_date",
  "invoice_date",
  "billing_date",
  "issue_date",
  "issued_date",
  "date_issued",
  "statement_period_end",
];

const RECEIPT_DATE_KEYS = [
  "receipt_date",
  "date_of_purchase",
  "purchase_date",
  "transaction_date",
  "date_of_transaction",
  "paid_date",
  "payment_date",
  "sale_date",
  "invoice_date",
];

// Date-ish fields that are not the document's own date. A due date is handled
// by its own tier for bills and must not leak into receipts.
const IGNORED_DATE_KEY =
  /(expir|valid|until|birth|dob|deadline|due|term|duration|warranty|return)/;

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isValidParts({ year, month, day }: DateParts): boolean {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

function toDateKey({ year, month, day }: DateParts): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeYear(raw: number): number {
  if (raw >= 100) return raw;
  return raw < 70 ? 2000 + raw : 1900 + raw;
}

/** Parses the free-text date values the extractor copies off a document. */
export function parseDateText(
  raw: string | null | undefined,
  fallbackYear: number,
): DateParts | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  // 2026-10-15, 2026/10/15, 2026.10.15 (possibly followed by a time).
  const iso = text.match(/(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (iso) {
    const parts = {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
    };
    if (isValidParts(parts)) return parts;
  }

  // October 15, 2026 / 15 Oct 2026 / Oct 2026
  const name = text.match(MONTH_PATTERN);
  if (name) {
    const month = MONTH_INDEX[name[1].slice(0, 3).toLowerCase()];
    const index = name.index ?? 0;
    const rest = `${text.slice(0, index)} ${text.slice(index + name[0].length)}`;
    const numbers = (rest.match(/\d+/g) ?? []).map(Number);
    const year =
      numbers.find((n) => n >= 1000 && n <= 2999) ?? fallbackYear;
    const day = numbers.find((n) => n >= 1 && n <= 31) ?? 1;
    const parts = { year, month, day };
    if (isValidParts(parts)) return parts;
  }

  // 10/15/2026 or 15/10/2026. When both sides are <= 12 the app's locale
  // (month first) wins; a value above 12 disambiguates day first.
  const numeric = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
  if (numeric) {
    let first = Number(numeric[1]);
    let second = Number(numeric[2]);
    if (first > 12 && second <= 12) {
      const swap = first;
      first = second;
      second = swap;
    }
    const parts = {
      year: normalizeYear(Number(numeric[3])),
      month: first,
      day: second,
    };
    if (isValidParts(parts)) return parts;
  }

  return null;
}

/** Local calendar date of an ISO timestamp, as YYYY-MM-DD. */
export function localDateKey(date: Date): string {
  return toDateKey({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

/** Local calendar date of an ISO timestamp, or null when unparseable. */
export function dateKeyFromTimestamp(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return localDateKey(date);
}

function pickValue(fields: FieldLike[], keys: string[]): string | null {
  for (const key of keys) {
    const match = fields.find((f) => f.key === key && f.value?.trim());
    if (match) return match.value;
  }
  // Tolerates prefixes the extractor makes up, e.g. "meralco_due_date".
  // Only multi-word keys are suffix-matched, so the bare "due" tier cannot
  // accidentally match an "amount_due" money field.
  for (const key of keys) {
    if (!key.includes("_")) continue;
    const match = fields.find(
      (f) => f.key.endsWith(`_${key}`) && f.value?.trim(),
    );
    if (match) return match.value;
  }
  return null;
}

function pickGenericValue(fields: FieldLike[]): string | null {
  const candidates = fields.filter(
    (f) =>
      f.value?.trim() &&
      f.key.includes("date") &&
      !IGNORED_DATE_KEY.test(f.key),
  );
  // An exact "date" field is the most likely to be the document's own date.
  const exact = candidates.find((f) => f.key === "date");
  return (exact ?? candidates[0])?.value ?? null;
}

/** Extracted deadlines are date-only strings; deadlines edited in the app are
 *  full ISO timestamps, so they have to be read in local time. */
function deadlineDateText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return dateKeyFromTimestamp(text);
}

export function resolveExpenseDate({
  category,
  fields,
  deadlineAt,
  createdAt,
}: {
  category: string | null;
  fields: FieldLike[];
  deadlineAt?: string | null;
  createdAt: string;
}): ResolvedExpenseDate | null {
  const normalized = fields.map((f) => ({
    key: normalizeKey(f.key),
    value: f.value,
  }));

  const created = dateKeyFromTimestamp(createdAt);
  const fallbackYear = created
    ? Number(created.slice(0, 4))
    : new Date().getFullYear();

  const fromText = (raw: string | null | undefined): string | null => {
    const parts = parseDateText(raw, fallbackYear);
    return parts ? toDateKey(parts) : null;
  };
  const fromKeys = (keys: string[]) =>
    fromText(pickValue(normalized, keys));

  const isBill = (category ?? "").trim().toLowerCase() === "bill";
  const candidates: Array<() => string | null> = isBill
    ? [
        () => fromKeys(DUE_KEYS),
        () => fromText(deadlineDateText(deadlineAt)),
        () => fromKeys(BILL_DATE_KEYS),
        () => fromText(pickGenericValue(normalized)),
      ]
    : [
        () => fromKeys(RECEIPT_DATE_KEYS),
        () => fromText(pickGenericValue(normalized)),
      ];

  for (const candidate of candidates) {
    const date = candidate();
    if (date) return { date, source: "extracted" };
  }

  return created ? { date: created, source: "created" } : null;
}
