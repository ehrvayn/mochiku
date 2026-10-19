import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Item } from "../types/item";
import { SCHEDULE_KEY, refreshSchedule, type ScheduleData } from "../store/appCache";
import { useCacheEntry } from "../store/cache";
import { markItemsDone } from "@/db/items";

export const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const daysUntil = (iso: string) =>
  Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86400000);

export type DeadlineEntry = { item: Item; days: number };

const EMPTY: Item[] = [];

export function useScheduleData() {
  const { data, settled } = useCacheEntry<ScheduleData>(SCHEDULE_KEY);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await refreshSchedule();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
        // "Next 7 days", not "This week": the week strip above already uses
        // that label for the calendar week, and these are different spans.
        {
          title: "Next 7 days",
          items: rest.filter((e) => e.days >= 0 && e.days <= 7),
        },
        { title: "Later", items: rest.filter((e) => e.days > 7) },
        { title: "Overdue", items: rest.filter((e) => e.days < 0) },
      ].filter((g) => g.items.length > 0),
      // Items still eligible to be marked as done. `getUpcomingItems()`
      // already excludes `mark_as_done = 1` in SQL; the guard below keeps that
      // true if that query ever changes.
      markableItems: entries.filter((e) => e.item.mark_as_done !== 1),
    };
  }, [upcoming]);

  return {
    pending,
    upcoming,
    refreshing,
    refresh,
    isLoading: !settled,
    ...derived,
  };
}
