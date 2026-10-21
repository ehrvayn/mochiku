/**
 * Money helpers for the Expenses tab.
 *
 * Amounts are stored on `items.amount_minor` as integer centavos so totals are
 * exact. The value is derived from the free-text `item_fields` the extractor
 * returns, which can look like "₱1,234.56", "PHP 1234", or "1.234,56".
 */

type FieldLike = { key: string; value: string | null };

const CURRENCY_NOISE = /(?:PHP|Php|php|PESO|Pesos?|pesos?|USD|EUR|GBP|JPY|AUD|CAD|₱|\$|€|£|¥)/g;

const NOT_AMOUNT =
  /(count|qty|quantity|items|pcs|pieces|number|account|phone|date|time|year|percent|rate)/;

// Higher priority first. `amount_due` beats a stray `total` from a summary
// table, and `total` beats `subtotal`.
const EXACT_KEYS = [
  "amount_due",
  "amountdue",
  "amount_due_now",
  "total_due",
  "total_amount_due",
  "total_amount",
  "grand_total",
  "grandtotal",
  "total",
  "amount",
  "balance_due",
  "balance",
  "net_amount",
  "subtotal",
  "sub_total",
  "price",
  "cost",
  "fee",
];

const AMOUNT_WORD = /(^|_)(amount|total|balance|price|cost|fee)(_|$)/;

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function keyRank(key: string): number | null {
  if (NOT_AMOUNT.test(key)) return null;
  const exact = EXACT_KEYS.indexOf(key);
  if (exact !== -1) return exact;
  if (AMOUNT_WORD.test(key)) return EXACT_KEYS.length;
  return null;
}

function normalizeNumber(token: string): string {
  const lastComma = token.lastIndexOf(",");
  const lastDot = token.lastIndexOf(".");
  const commas = (token.match(/,/g) ?? []).length;
  const dots = (token.match(/\./g) ?? []).length;

  if (commas > 0 && dots > 0) {
    // The right-most separator is the decimal one.
    return lastComma > lastDot
      ? token.replace(/\./g, "").replace(",", ".")
      : token.replace(/,/g, "");
  }

  if (commas > 0) {
    if (commas > 1) return token.replace(/,/g, "");
    const decimals = token.length - lastComma - 1;
    return decimals === 3 ? token.replace(",", "") : token.replace(",", ".");
  }

  if (dots > 1) {
    const decimals = token.length - lastDot - 1;
    return decimals <= 2
      ? `${token.slice(0, lastDot).replace(/\./g, "")}.${token.slice(lastDot + 1)}`
      : token.replace(/\./g, "");
  }

  return token;
}

/** Parses a human-written amount into integer centavos, or null. */
export function parseAmountToMinor(raw: string | null | undefined): number | null {
  if (!raw) return null;

  const withoutCurrency = raw
    .replace(CURRENCY_NOISE, " ")
    .replace(/\bP(?=\s*\d)/g, " ");

  const match = withoutCurrency.match(/-?\s*(?:\d[\d.,]*|[.,]\d+)/);
  if (!match) return null;

  const token = match[0].replace(/\s+/g, "").replace(/[.,]+$/, "");
  if (!/\d/.test(token)) return null;

  const value = Number(normalizeNumber(token));
  if (!Number.isFinite(value)) return null;

  const minor = Math.round(value * 100);
  return Number.isSafeInteger(minor) ? minor : null;
}

/**
 * Picks the most plausible amount out of an item's extracted fields.
 * Returns null when nothing parses, which keeps the item out of the totals
 * instead of counting a wrong number.
 */
export function pickAmountField(fields: FieldLike[]): number | null {
  let bestRank = Number.POSITIVE_INFINITY;
  let best: number | null = null;
  // A zero `amount_due` usually means "already paid", while the receipt's
  // `total` is the money that actually moved. Prefer a non-zero candidate and
  // only fall back to zero when that is all the document offers.
  let zeroRank = Number.POSITIVE_INFINITY;

  for (const field of fields) {
    const rank = keyRank(normalizeKey(field.key));
    if (rank === null || rank >= bestRank) continue;

    const minor = parseAmountToMinor(field.value);
    if (minor === null) continue;

    if (minor === 0) {
      if (rank < zeroRank) zeroRank = rank;
      continue;
    }

    bestRank = rank;
    best = minor;
  }

  return best ?? (zeroRank < Number.POSITIVE_INFINITY ? 0 : null);
}

/**
 * Always pesos, per the app's locale. No Intl dependency, so the output is
 * identical on every device and test run.
 */
export function formatPeso(minor: number): string {
  const negative = minor < 0;
  const abs = Math.abs(Math.round(minor));
  const pesos = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = (abs % 100).toString().padStart(2, "0");

  return `${negative ? "-" : ""}₱${pesos}.${cents}`;
}
