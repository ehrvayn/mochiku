import { getAllItems, getItemsByStatus, getUpcomingItems } from "../db/items";
import { Item } from "../types/item";
import { loadInto, resetAll, updateData } from "./cache";

/**
 * Shared cache keys and loaders for the two list screens.
 *
 * Both screens read from the same table, so they live together here: it keeps
 * status changes (confirm/store) able to correct both caches from one place,
 * and avoids the circular import that splitting them per-screen would create.
 */

export const HOME_KEY = "home";
export const LIBRARY_KEY = "library";

/** Raw Home inputs. The deadline grouping is derived in the hook. */
export type HomeData = {
  pending: Item[];
  upcoming: Item[];
};

/** Raw Library rows. Saved/Drafts is a pure derivation in the screen. */
export type LibraryData = Item[];

const notExpired = (i: Item) =>
  !i.deadline_at || new Date(i.deadline_at) >= new Date();

export function loadHome(): Promise<HomeData> {
  return Promise.all([
    getItemsByStatus("pending_review"),
    getUpcomingItems(),
  ]).then(([pending, upcoming]) => ({
    pending: pending.filter(notExpired),
    upcoming: upcoming.filter((i) => i.deadline_at),
  }));
}

export function loadLibrary(): Promise<LibraryData> {
  return getAllItems();
}

export function refreshHome(): Promise<HomeData | null> {
  return loadInto(HOME_KEY, loadHome);
}

export function refreshLibrary(): Promise<LibraryData | null> {
  return loadInto(LIBRARY_KEY, loadLibrary);
}

/**
 * Drop deleted rows from the cache immediately so a refocus never shows an
 * item that no longer exists. The focus-time refresh corrects anything missed.
 */
export function removeFromLibraryCache(ids: string[]) {
  const doomed = new Set(ids);
  updateData<LibraryData>(LIBRARY_KEY, (previous) =>
    previous.filter((item) => !doomed.has(item.id)),
  );
  updateData<HomeData>(HOME_KEY, (previous) => ({
    pending: previous.pending.filter((item) => !doomed.has(item.id)),
    upcoming: previous.upcoming.filter((item) => !doomed.has(item.id)),
  }));
}

/**
 * A confirmed or stored item changes status, which moves it between the
 * Saved and Drafts tabs and can add it to Home's upcoming list. Refetching
 * both caches keeps them truthful without dropping data the user can see.
 */
export function resyncAfterStatusChange() {
  void refreshLibrary();
  void refreshHome();
}

/**
 * Clear every cached list. Call this on anything that replaces the whole
 * dataset, such as a future logout or "reset all data", so no stale rows
 * survive into the next account.
 */
export function resetAppCaches() {
  resetAll();
}