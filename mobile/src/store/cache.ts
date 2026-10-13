import { useCallback, useSyncExternalStore } from "react";

/**
 * A tiny external store for async list data.
 *
 * The goal is to remove the "empty state flashes before data arrives" problem
 * without a full react-query migration. Screens read the cache synchronously,
 * so the very first render already has the previous data; a focus-driven
 * refresh then replaces it in the background.
 *
 * This deliberately holds no business logic and never touches the database
 * layer - loaders live alongside their screens.
 */

type Listener = () => void;

type Entry = {
  /** Last known good data. Null until the first successful load. */
  data: unknown;
  /** True once a load has settled, whether it succeeded or failed. */
  settled: boolean;
  /** True if the last load failed. Kept separate so callers can distinguish
   *  "loaded and genuinely empty" from "we could not reach the data". */
  failed: boolean;
};

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<Listener>>();

function entryFor(key: string): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = { data: null, settled: false, failed: false };
    entries.set(key, entry);
  }
  return entry;
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

/** Read without subscribing. Safe to call during render for plain values. */
export function getData<T>(key: string): T | null {
  const entry = entries.get(key);
  return entry?.settled ? (entry.data as T) : null;
}

export function isSettled(key: string): boolean {
  return entries.get(key)?.settled ?? false;
}

export function setData<T>(key: string, data: T) {
  entries.set(key, { data, settled: true, failed: false });
  notify(key);
}

/**
 * Patch cached data in place. Used after a delete so the cache stays correct
 * immediately and the UI never shows a removed item again.
 */
export function updateData<T>(key: string, updater: (previous: T) => T) {
  const entry = entryFor(key);
  if (!entry.settled || entry.data === null) return;
  entries.set(key, { ...entry, data: updater(entry.data as T) });
  notify(key);
}

/** Drop a single entry. Next render shows the skeleton again. */
export function invalidate(key: string) {
  entries.delete(key);
  notify(key);
}

/**
 * Drop everything. Call on anything that replaces the whole dataset, such as
 * a future logout or "reset all data".
 */
export function resetAll() {
  const keys = new Set([...entries.keys(), ...listeners.keys()]);
  entries.clear();
  keys.forEach(notify);
}

function subscribe(key: string, listener: Listener) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

/**
 * Run a loader and fold the result into the cache.
 *
 * `settled` flips on both success and failure, so a failing first load shows
 * the empty state rather than an endless skeleton.
 */
export async function loadInto<T>(
  key: string,
  loader: () => Promise<T>,
): Promise<T | null> {
  try {
    const data = await loader();
    setData(key, data);
    return data;
  } catch {
    const previous = entries.get(key);
    // Keep any previously loaded data; only mark the attempt as settled so
    // the skeleton stops even if we have nothing to show yet.
    entries.set(key, {
      data: previous?.data ?? null,
      settled: true,
      failed: true,
    });
    notify(key);
    return null;
  }
}

/**
 * Subscribe a component to one cache key.
 *
 * `data` is whatever was last loaded, so a remount renders real content
 * immediately instead of an empty state.
 */
export function useCacheEntry<T>(key: string): {
  data: T | null;
  settled: boolean;
  failed: boolean;
  refresh: () => void;
} {
  const subscribeKey = useCallback(
    (listener: Listener) => subscribe(key, listener),
    [key],
  );
  const getSnapshot = useCallback(() => entryFor(key), [key]);

  const entry = useSyncExternalStore(subscribeKey, getSnapshot, getSnapshot);

  return {
    data: entry.settled ? (entry.data as T) : null,
    settled: entry.settled,
    failed: entry.failed,
    refresh: notify.bind(null, key) as () => void,
  };
}