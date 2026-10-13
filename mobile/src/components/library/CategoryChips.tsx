import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { CATEGORIES, useCategoryColors } from "../../constants/categories";
import { useThemeColor } from "../../theme";

export default function CategoryChips({
  counts,
  selected,
  onSelect,
}: {
  counts: Record<string, number>;
  selected: string;
  onSelect: (label: string) => void;
}) {
  const categoryColors = useCategoryColors();
  const ink = useThemeColor("ink", "#2B2438");
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");
  const line = useThemeColor("line", "#F0E4CF");
  const paper = useThemeColor("paper", "#FFFFFF");
  const brandInk = useThemeColor("brand-ink", "#C2531A");

  const chips = [
    { label: "All", icon: "apps-outline" as const },
    ...CATEGORIES.map((c) => ({ label: c.label, icon: c.icon })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {chips.map(({ label, icon }) => {
        const active = selected === label;
        const count = counts[label] ?? 0;
        const empty = count === 0;
        const cat = label === "All" ? undefined : categoryColors[label];

        const bg = active
          ? (cat?.bg ?? brandInk)
          : empty
            ? "transparent"
            : paper;
        const fg = active
          ? (cat?.fg ?? paper)
          : empty
            ? inkFaint
            : ink;

        return (
          <TouchableOpacity
            key={label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            activeOpacity={0.7}
            onPress={() => onSelect(label)}
            className="flex-row items-center gap-1.5 px-3.5 h-9 rounded-full border"
            style={{
              backgroundColor: bg,
              borderColor: active ? (cat?.fg ?? brandInk) : line,
              opacity: empty && !active ? 0.55 : 1,
            }}
          >
            <Ionicons
              name={icon}
              size={13}
              color={active ? (cat?.fg ?? paper) : fg}
            />
            <Text className="text-sm font-body-bold" style={{ color: fg }}>
              {label}
            </Text>
            <Text
              className="text-xs font-body-bold"
              style={{ color: active ? (cat?.fg ?? paper) : inkFaint }}
            >
              {count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}