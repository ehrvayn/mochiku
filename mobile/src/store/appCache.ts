import { getAllItems, getItemsByStatus, getUpcomingItems } from "../db/items";
import { Item } from "../types/item";
import { loadInto, resetAll, updateData } from "./cache";

export const SCHEDULE_KEY = "schedule";
export const LIBRARY_KEY = "library";

export type ScheduleData = {
  pending: Item[];
  upcoming: Item[];
};

export type LibraryData = Item[];

const notExpired = (i: Item) =>
  !i.deadline_at || new Date(i.deadline_at) >= new Date();

export function loadSchedule(): Promise<ScheduleData> {
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

export function refreshSchedule(): Promise<ScheduleData | null> {
  return loadInto(SCHEDULE_KEY, loadSchedule);
}

export function refreshLibrary(): Promise<LibraryData | null> {
  return loadInto(LIBRARY_KEY, loadLibrary);
}

export function removeFromLibraryCache(ids: string[]) {
  const doomed = new Set(ids);
  updateData<LibraryData>(LIBRARY_KEY, (previous) =>
    previous.filter((item) => !doomed.has(item.id)),
  );
  updateData<ScheduleData>(SCHEDULE_KEY, (previous) => ({
    pending: previous.pending.filter((item) => !doomed.has(item.id)),
    upcoming: previous.upcoming.filter((item) => !doomed.has(item.id)),
  }));
}

export function resyncAfterStatusChange() {
  void refreshLibrary();
  void refreshSchedule();
}

export function resetAppCaches() {
  resetAll();
}