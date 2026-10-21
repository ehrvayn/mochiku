import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "../../theme";
import { formatPeso } from "../../utils/money";

export default function ExpenseMonthRow({
  label,
  totalMinor,
  count,
  onPress,
}: {
  label: string;
  totalMinor: number;
  count: number;
  onPress: () => void;
}) {
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const line = useThemeColor("line", "#F0E4CF");

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${formatPeso(totalMinor)}, ${count} ${
        count === 1 ? "item" : "items"
      }`}
      className="mx-5 mb-3 bg-paper border border-line rounded-2xl px-4 py-4 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-10 h-10 rounded-full bg-brand-soft items-center justify-center">
          <Ionicons name="calendar-outline" size={18} color={brandInk} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-heading text-ink">{label}</Text>
          <Text className="text-xs font-body-medium text-ink-faint">
            {count} {count === 1 ? "item" : "items"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1.5 ml-3">
        <Text
          className="text-sm font-body-bold text-ink"
          numberOfLines={1}
        >
          {formatPeso(totalMinor)}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={line} />
      </View>
    </TouchableOpacity>
  );
}
