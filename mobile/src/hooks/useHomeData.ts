import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Item } from "../types/item";
import {
  HOME_KEY,
  refreshHome,
  type HomeData,
} from "../store/appCache";
import { useCacheEntry } from "../store/cache";

export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const daysUntil = (iso: string) =>
  Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86400000);

export type DeadlineEntry = { item: Item; days: number };

/** Stable empty arrays so the derived memo below does not churn. */
const EMPTY: Item[] = [];

export function useHomeData() {
  // Read the shared cache synchronously, so a remount renders the previous
  // data on its very first frame instead of an empty state.
  const { data, settled } = useCacheEntry<HomeData>(HOME_KEY);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await refreshHome();
  }, []);

  // Focus always refetches, but it never resets the cache, so this refreshes
  // silently in the background while the previous data stays on screen.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pending = data?.pending ?? EMPTY;
  const upcoming = data?.upcoming ?? EMPTY;

  const derived = useMemo(() => {
    const entries: DeadlineEntry[] = upcoming.map((item) => ({
      item,
      days: daysUntil(item.deadline_at!),
    }));
    const hero = entries.find((e) => e.days >= 0) ?? null;
    const rest = entries.filter((e) => e !== hero);
    return {
      hero,
      overdueCount: entries.filter((e) => e.days < 0).length,
      weekCount: entries.filter((e) => e.days >= 0 && e.days <= 7).length,
      groups: [
        { title: "This week", items: rest.filter((e) => e.days >= 0 && e.days <= 7) },
        { title: "Later", items: rest.filter((e) => e.days > 7) },
        { title: "Overdue", items: rest.filter((e) => e.days < 0) },
      ].filter((g) => g.items.length > 0),
    };
  }, [upcoming]);

  /**
 * `isLoading` is true only until the very first load settles. On a warm cache
 * it is false from the first render, which is what keeps the empty state from
 * flashing when navigating between screens.
 */
return {
    pending,
    upcoming,
    refreshing,
    refresh,
    isLoading: !settled,
    ...derived,
  };
}