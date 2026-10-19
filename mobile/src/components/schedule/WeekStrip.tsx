import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getTone } from "../../constants/tones";
import { useThemeColor } from "../../theme";
import { Item } from "../../types/item";
import { openItem } from "./ScheduleParts";

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Monday-first, matching how people read a calendar. */
const startOfWeek = (d: Date) => {
  const day = d.getDay(); // 0 = Sunday
  const offset = day === 0 ? 6 : day - 1;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
};

/** Local-midnight key, matching how `daysUntil` buckets deadlines. */
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const MAX_DOTS = 3;
/** Keeps the day list from growing unbounded on a heavy day. */
const MAX_VISIBLE_ROWS = 3;

export type WeekStripProps = {
  /** Items with a confirmed deadline. Ones outside this week are ignored. */
  items: Item[];
  /** True while the screen is in multi-select mode; day taps are ignored. */
  disabled?: boolean;
};

export default function WeekStrip({ items, disabled }: WeekStripProps) {
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayKey = key(today);
  const weekStart = startOfWeek(today);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate() + i,
        );
        return {
          date,
          k: key(date),
          label: date.toLocaleDateString(undefined, { weekday: "narrow" }),
          isToday: key(date) === todayKey,
          isPast: startOfDay(date) < todayStart,
        };
      }),
    // Stable for the whole day; rolls over at midnight or on remount.
    [todayKey, weekStart.getTime()],
  );

  // Full items per day, not just counts, so the day list can show them.
  const byDay = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      if (!item.deadline_at) continue;
      const k = key(new Date(item.deadline_at));
      const list = map.get(k);
      if (list) list.push(item);
      else map.set(k, [item]);
    }
    return map;
  }, [items]);

  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Open on today. The day list is a drill-down, so defaulting it to another
  // day would repeat whatever the "Next up" card is already showing.
  const activeKey = selected ?? todayKey;
  const activeDay = days.find((d) => d.k === activeKey) ?? days[0];
  const activeItems = byDay.get(activeKey) ?? [];

  const pickDay = (k: string) => {
    setSelected(k);
    setShowAll(false);
  };

  const collapsed = activeItems.slice(0, MAX_VISIBLE_ROWS);
  const hidden = activeItems.length - collapsed.length;
  const visibleItems = showAll ? activeItems : collapsed;

  const weekEnd = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + 6,
  );
  const weekLabel = `${weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} - ${weekEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

  const activeLabel = activeDay.date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    // Strip and day list are one card, not two: they answer a single
    // question. A hairline separates them instead of a second border.
    <View className="px-5 pt-4 pb-5">
      <View className="bg-paper dark:bg-paper-dark border border-line dark:border-line-dark rounded-3xl px-3 pt-3.5 pb-3">
        <View className="flex-row items-baseline justify-between px-1 mb-3">
          <Text className="text-[11px] font-body-bold text-ink-faint dark:text-ink-faint-dark uppercase tracking-wider">
            This week
          </Text>
          <Text className="text-[11px] font-body-medium text-ink-faint dark:text-ink-faint-dark">
            {weekLabel}
          </Text>
        </View>

        <View className="flex-row justify-between px-0.5">
          {days.map((day) => {
            const count = (byDay.get(day.k) ?? []).length;
            const dots = Math.min(count, MAX_DOTS);
            const overflow = count - dots;
            const isActive = day.k === activeKey;

            // The card behind these is `paper`, so unselected discs use the
            // app background to stay visible instead of vanishing into it.
            let discClass =
              "bg-cream dark:bg-night border border-line dark:border-line-dark";
            if (isActive) discClass = "bg-brand";
            else if (day.isToday) discClass = "bg-transparent border-2 border-brand";
            else if (day.isPast) discClass = "bg-transparent";

            const numClass = isActive
              ? "text-white"
              : day.isPast
                ? "text-ink-faint/40"
                : "text-ink dark:text-ink-dark";

            const labelClass = isActive || day.isToday
              ? "text-brand-ink"
              : day.isPast
                ? "text-ink-faint/40"
                : "text-ink-soft dark:text-ink-soft-dark";

            return (
              <Pressable
                key={day.k}
                onPress={() => pickDay(day.k)}
                disabled={disabled}
                hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive, disabled: !!disabled }}
                accessibilityLabel={`${day.date.toLocaleDateString(undefined, {
                  weekday: "long",
                })}, ${day.date.getDate()}. ${
                  count === 0 ? "Nothing scheduled." : `${count} scheduled.`
                }`}
                accessibilityHint={
                  isActive ? "Showing this day's items below." : "Select this day."
                }
                className={`items-center gap-1 ${disabled ? "opacity-60" : ""}`}
              >
                <Text
                  className={`text-[10px] font-body-bold uppercase ${labelClass}`}
                >
                  {day.label}
                </Text>

                <View
                  className={`w-9 h-9 rounded-full items-center justify-center ${discClass}`}
                >
                  <Text className={`text-sm font-heading ${numClass}`}>
                    {day.date.getDate()}
                  </Text>
                </View>

                {/* Fixed height (12px) so cells with a count, dots, or nothing
                    still align on the same baseline. */}
                <View className="h-3 flex-row items-center justify-center gap-0.5">
                  {count === 0 ? null : overflow > 0 ? (
                    <Text
                      className={`text-[10px] font-body-bold leading-none ${
                        isActive ? "text-brand-ink" : "text-brand-ink/70"
                      }`}
                    >
                      {count}
                    </Text>
                  ) : (
                    Array.from({ length: dots }, (_, i) => (
                      <View
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-brand" : "bg-brand/60"
                        }`}
                      />
                    ))
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Day detail, joined to the strip above by a hairline. */}
        <View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${activeLabel}. ${
            activeItems.length === 0
              ? "Nothing scheduled for this day."
              : `${activeItems.length} item${
                  activeItems.length === 1 ? "" : "s"
                } scheduled.`
          }`}
          className="mt-2.5 pt-2.5 border-t border-line/70 dark:border-line-dark/70 px-1"
        >
          {activeItems.length === 0 ? (
            // One line instead of a label plus a message: an empty day
            // should not occupy the same height as a day with items.
            <View className="flex-row items-baseline justify-between gap-2">
              <Text className="text-[11px] font-body-bold text-ink-faint dark:text-ink-faint-dark uppercase tracking-wider">
                {activeLabel}
              </Text>
              <Text className="text-[12px] font-body-medium text-ink-faint dark:text-ink-faint-dark">
                Nothing scheduled
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-[11px] font-body-bold text-ink-faint dark:text-ink-faint-dark uppercase tracking-wider">
                {activeLabel}
              </Text>

              <View className="mt-1">
                {visibleItems.map((item, i) => {
                  const daysLeft = Math.round(
                    (startOfDay(new Date(item.deadline_at!)) - todayStart) /
                      86400000,
                  );
                  const tone = getTone(daysLeft);
                  const last = i === visibleItems.length - 1;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => openItem(item.id)}
                      disabled={disabled}
                      accessibilityRole="button"
                      accessibilityLabel={item.title ?? "Untitled"}
                      className={`flex-row items-center gap-3 py-2.5 ${
                        last
                          ? ""
                          : "border-b border-line/60 dark:border-line-dark/60"
                      } ${disabled ? "opacity-60" : ""}`}
                    >
                      <View className="flex-1">
                        <Text
                          className="text-sm font-heading text-ink dark:text-ink-dark"
                          numberOfLines={1}
                        >
                          {item.title ?? "Untitled"}
                        </Text>
                        <Text
                          className={`text-[11px] font-body-bold mt-0.5 ${tone.text}`}
                        >
                          {daysLeft === 0
                            ? "Due today"
                            : daysLeft === 1
                              ? "Due tomorrow"
                              : daysLeft > 0
                                ? `${daysLeft} days left`
                                : tone.label}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={inkFaint}
                      />
                    </Pressable>
                  );
                })}

                {hidden > 0 && (
                  <Pressable
                    onPress={() => setShowAll(true)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${hidden} more item${
                      hidden === 1 ? "" : "s"
                    }`}
                    className="flex-row items-center justify-center gap-1 pt-2.5 pb-0.5"
                  >
                    <Text className="text-xs font-body-bold text-brand-ink">
                      Show {hidden} more
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={brandInk} />
                  </Pressable>
                )}

                {showAll && activeItems.length > MAX_VISIBLE_ROWS && (
                  <Pressable
                    onPress={() => setShowAll(false)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel="Collapse list"
                    className="flex-row items-center justify-center gap-1 pt-2.5 pb-0.5"
                  >
                    <Text className="text-xs font-body-bold text-brand-ink">
                      Show less
                    </Text>
                    <Ionicons name="chevron-up" size={14} color={brandInk} />
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}