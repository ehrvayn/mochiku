import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { getCategory, useCategoryColors } from "../../constants/categories";
import { getTone, softShadow } from "../../constants/tones";
import { DeadlineEntry, MONTHS } from "../../hooks/useHomeData";
import { useThemeColor } from "../../theme";
import { Item } from "../../types/item";
import Mochiku, { Mood } from "../Mochiku";
import { ReactNode } from "react";

const openItem = (id: string) =>
  router.push({ pathname: "/item/[id]", params: { id } });

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

function CategoryTag({ value }: { value: string | null }) {
  const categoryColors = useCategoryColors();
  const category = getCategory(value);
  const c = categoryColors[category.label];
  return (
    <View className="flex-row items-center w-auto gap-1.5 px-2.5 py-1 rounded-full bg-cream dark:bg-night border border-line dark:border-line-dark">
      <Ionicons name={category.icon} size={12} color={c.fg} />
      <Text className="text-[11px] font-body-bold" style={{ color: c.fg }}>
        {category.label}
      </Text>
    </View>
  );
}

export function MascotHeader({
  message,
  mood,
}: {
  message: ReactNode;
  mood: Mood;
}) {
  return (
    <View className="flex-row items-center">
      <View className="items-center justify-center">
        <Mochiku mood={mood} height={117} width={110} />
      </View>
      <View className="flex-1 justify-center">
        <View
          className="relative rounded-3xl p-4 bg-paper dark:bg-paper-dark border border-line dark:border-line-dark shadow-sm"
          style={softShadow}
        >
          <Text className="text-sm font-heading text-ink dark:text-ink-dark leading-snug">
            {message}
          </Text>
          <View className="absolute -left-2 top-6 w-3 h-3 rotate-45 bg-paper dark:bg-paper-dark border-l border-b border-line dark:border-line-dark" />
        </View>
      </View>
    </View>
  );
}

export function NextUpCard({ entry }: { entry: DeadlineEntry }) {
  const { item, days } = entry;
  const tone = getTone(days);
  const word = days === 0 ? "Today" : days === 1 ? "Tomorrow" : String(days);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => openItem(item.id)}
      className="flex-row bg-paper dark:bg-paper-dark border border-line dark:border-line-dark rounded-3xl overflow-hidden"
      style={softShadow}
    >
      <View
        className={`w-28 items-center justify-center py-5 px-3 ${tone.hero}`}
      >
        <Text
          className={`font-display ${tone.heroText} ${
            days > 1 ? "text-3xl" : "text-base"
          }`}
          numberOfLines={1}
        >
          {word}
        </Text>
        {days > 1 && (
          <Text className={`text-xs font-body-bold mt-0.5 ${tone.heroSub}`}>
            days left
          </Text>
        )}
      </View>

      <View className="flex-1 p-4 justify-center gap-2">
        <Text className="text-[11px] font-body-bold text-ink-faint dark:text-ink-faint-dark uppercase tracking-wider">
          Next up
        </Text>
        <Text
          className="text-base font-heading text-ink dark:text-ink-dark"
          numberOfLines={2}
        >
          {item.title ?? "Untitled"}
        </Text>
        <View className="flex-row items-center justify-between pt-1">
          <Text className="text-xs font-body-medium text-ink-soft dark:text-ink-soft-dark">
            {shortDate(item.deadline_at!)}
          </Text>
          <CategoryTag value={item.category} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="px-5 mb-3">
      <Text className="text-lg font-heading text-ink dark:text-ink-dark">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-xs font-body-medium text-ink-faint dark:text-ink-faint-dark mt-0.5">
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function ReviewCard({ item }: { item: Item }) {
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => openItem(item.id)}
      className="w-72 flex-row items-center gap-3.5 bg-paper dark:bg-paper-dark border border-line dark:border-line-dark rounded-3xl p-3.5"
      style={softShadow}
    >
      <Image
        source={{ uri: item.local_image_uri }}
        className="w-16 h-16 rounded-2xl bg-cream dark:bg-night border border-line dark:border-line-dark"
        resizeMode="cover"
      />
      <View className="flex-1 gap-1.5">
        <Text
          className="text-sm font-heading text-ink dark:text-ink-dark"
          numberOfLines={1}
        >
          {item.title ?? "Untitled"}
        </Text>
        <View className="flex-row items-center gap-1.5 bg-soon-soft px-2.5 py-1 rounded-full self-start">
          <View className="w-1.5 h-1.5 rounded-full bg-soon" />
          <Text
            className="text-[11px] font-body-bold text-soon-ink"
            numberOfLines={1}
          >
            {item.deadline_at
              ? `Check ${shortDate(item.deadline_at)}`
              : "Needs date"}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={inkFaint} />
    </TouchableOpacity>
  );
}

function DeadlineRow({
  entry,
  first,
}: {
  entry: DeadlineEntry;
  first: boolean;
}) {
  const { item, days } = entry;
  const date = new Date(item.deadline_at!);
  const tone = getTone(days);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => openItem(item.id)}
      className={`flex-row items-center gap-4 px-4 py-3.5 ${
        first ? "" : "border-t border-line/60 dark:border-line-dark/60"
      }`}
    >
      <View className="w-11 items-center justify-center bg-cream/60 dark:bg-night/60 py-1.5 rounded-2xl border border-line/40 dark:border-line-dark/40">
        <Text className="text-[10px] font-body-bold text-ink-faint dark:text-ink-faint-dark uppercase">
          {MONTHS[date.getMonth()]}
        </Text>
        <Text className="text-lg font-display text-ink dark:text-ink-dark leading-tight">
          {date.getDate()}
        </Text>
      </View>

      <View className="flex-1 flex-col items-start gap-1">
        <Text
          className="text-sm font-heading text-ink dark:text-ink-dark"
          numberOfLines={1}
        >
          {item.title ?? "Untitled"}
        </Text>
        <CategoryTag value={item.category} />
      </View>

      <Text className={`text-xs font-body-bold ${tone.text}`}>
        {tone.label}
      </Text>
    </TouchableOpacity>
  );
}

export function DeadlineGroup({
  title,
  items,
}: {
  title: string;
  items: DeadlineEntry[];
}) {
  return (
    <View className="px-5 mb-5">
      <Text
        className={`text-xs font-body-bold mb-2 uppercase tracking-wider ${
          title === "Overdue"
            ? "text-urgent-ink"
            : "text-ink-faint dark:text-ink-faint-dark"
        }`}
      >
        {title}
      </Text>
      <View
        className="bg-paper dark:bg-paper-dark border border-line dark:border-line-dark rounded-3xl overflow-hidden"
        style={softShadow}
      >
        {items.map((e, i) => (
          <DeadlineRow key={e.item.id} entry={e} first={i === 0} />
        ))}
      </View>
    </View>
  );
}
