export type ItemStatus =
  | "uploaded"
  | "processing"
  | "pending_review"
  | "confirmed"
  | "stored"
  | "done"
  | "needs_manual";

export type SyncStatus = "pending" | "synced";

export type ExpenseDateSource = "extracted" | "created";

export interface Item {
  id: string;
  local_image_uri: string;
  category: string | null;
  title: string | null;
  status: ItemStatus;
  deadline_at: string | null;
  deadline_confirmed_at: string | null;
  mark_as_done: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  title_confidence: number | null;
  category_confidence: number | null;
  deadline_confidence: number | null;
  amount_minor: number | null;
  /** Date printed on the document, as local YYYY-MM-DD. */
  expense_date: string | null;
  /** Whether `expense_date` came from the document or the saved date. */
  expense_date_source: ExpenseDateSource | null;
}

export interface ItemField {
  id: number;
  item_id: string;
  key: string;
  value: string | null;
  confidence: number | null;
  user_edited: number;
}

export interface Scored<T> {
  value: T;
  confidence: number;
}

export interface ExtractedData {
  category: Scored<string>;
  title: Scored<string>;
  deadline: Scored<string | null>;
  fields: Record<string, Scored<string>>;
}
