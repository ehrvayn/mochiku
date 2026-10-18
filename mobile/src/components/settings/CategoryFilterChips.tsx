import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { CATEGORIES } from "../../constants/categories";
import { useThemeColor } from "../../theme";

type Props = {
  selected: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
};

export default function CategoryFilterChips({ selected, onChange }: Props) {
  const brandInk = useThemeColor("brand-ink", "#C2531A");

  const allOn = selected === null;
  const chosen = selected ?? new Set(CATEGORIES.map((c) => c.label));
  const isOn = (label: string) => allOn || chosen.has(label);

  const toggle = (label: string) => {
    const next = new Set(
      isOn(label) ? [...chosen].filter((c) => c !== label) : [...chosen, label],
    );
    onChange(next);
  };

  const setAll = () => {
    if (allOn) onChange(new Set<string>());
    else onChange(null);
  };

  return (
    <View className="bg-paper dark:bg-paper-dark rounded-2xl border border-line dark:border-line-dark px-4 py-4 gap-3">
      <Text className="text-xs font-body text-ink-faint dark:text-ink-faint-dark">
        {allOn
          ? "Choose what categories you want Mochiku to remind you."
          : chosen.size === 0
            ? "No reminders will be scheduled. Your deadlines still show up on Home."
            : `Only ${[...chosen].join(", ")} will remind you.`}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Chip
          label="All"
          icon="apps-outline"
          on={allOn}
          onPress={setAll}
          brandInk={brandInk}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.label}
            label={c.label}
            icon={isOn(c.label) ? "checkmark-circle" : c.icon}
            on={isOn(c.label)}
            onPress={() => toggle(c.label)}
            brandInk={brandInk}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({
  label,
  icon,
  on,
  onPress,
  brandInk,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  on: boolean;
  onPress: () => void;
  brandInk: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      className={`flex-row items-center gap-1.5 h-9 px-3 rounded-full border ${
        on
          ? "bg-brand-soft border-brand"
          : "bg-cream dark:bg-night border-line dark:border-line-dark"
      }`}
    >
      <Ionicons
        name={icon}
        size={13}
        color={on ? brandInk : undefined}
        style={on ? undefined : { opacity: 0.45 }}
      />
      <Text
        className={`text-xs font-body-bold ${on ? "text-brand-ink" : "text-ink-soft dark:text-ink-soft-dark"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
