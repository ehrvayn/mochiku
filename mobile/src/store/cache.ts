import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

type Entry = {
  data: unknown;
  settled: boolean;
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

export function updateData<T>(key: string, updater: (previous: T) => T) {
  const entry = entryFor(key);
  if (!entry.settled || entry.data === null) return;
  entries.set(key, { ...entry, data: updater(entry.data as T) });
  notify(key);
}

export function invalidate(key: string) {
  entries.delete(key);
  notify(key);
}

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

export async function loadInto<T>(
  key: string,
  loader: () => Promise<T>,
): Promise<T | null> {
  try {
    const data = await loader();
    setData(key, data);
    return data;
  } catch (error) {
    console.log(`cache load failed for "${key}":`, error);
    const previous = entries.get(key);
    entries.set(key, {
      data: previous?.data ?? null,
      settled: true,
      failed: true,
    });
    notify(key);
    return null;
  }
}

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