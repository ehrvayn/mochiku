import { getAllItems, getItemsByStatus, getUpcomingItems } from "../db/items";
import { Item } from "../types/item";
import { loadInto, resetAll, updateData } from "./cache";

export const HOME_KEY = "home";
export const LIBRARY_KEY = "library";

export type HomeData = {
  pending: Item[];
  upcoming: Item[];
};

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

export function resyncAfterStatusChange() {
  void refreshLibrary();
  void refreshHome();
}

export function resetAppCaches() {
  resetAll();
}