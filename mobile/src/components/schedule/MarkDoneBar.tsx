import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "../../theme";

type Props = {
  selecting: boolean;
  pickedCount: number;
  allPicked: boolean;
  onExit: () => void;
  onToggleAll: () => void;
  onConfirm: () => void;
};

export default function MarkDoneBar({
  selecting,
  pickedCount,
  allPicked,
  onExit,
  onToggleAll,
  onConfirm,
}: Props) {
  const brandInk = useThemeColor("brand-ink", "#C2531A");

  // Outside selection mode the bar has nothing to show. The long-press
  // hint used to live here as a standalone line between cards, which read as
  // an orphan; selection is now discovered by long-pressing a row.
  if (!selecting) return null;

  return (
    <View className="px-5 mb-4">
      <View className="rounded-3xl bg-paper dark:bg-paper-dark border border-line dark:border-line-dark px-4 py-3 gap-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-base font-body-medium text-ink dark:text-ink-dark">
              {pickedCount === 0
                ? "Pick the items you're finished with"
                : `${pickedCount} ${pickedCount === 1 ? "deadline" : "deadlines"} picked`}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Cancel marking as done"
            className="w-9 h-9 rounded-full bg-cream dark:bg-night border border-line dark:border-line-dark items-center justify-center"
          >
            <Ionicons name="close" size={18} color={brandInk} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleAll}
            accessibilityRole="button"
            className="h-10 px-4 rounded-full bg-cream dark:bg-night border border-line dark:border-line-dark items-center justify-center"
          >
            <Text className="text-sm font-body-bold text-brand-ink dark:text-brand">
              {allPicked ? "Clear" : "Select all"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={pickedCount === 0}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Mark selected as done"
            className={`flex-1 h-10 rounded-full flex-row items-center justify-center gap-1.5 ${
              pickedCount === 0 ? "bg-calm-soft" : "bg-calm"
            }`}
          >
            <Ionicons
              name="checkmark-done"
              size={17}
              color={pickedCount === 0 ? "#C9C3D1" : "#fff"}
            />
            <Text
              className={`text-sm font-body-bold ${
                pickedCount === 0 ? "text-ink-faint" : "text-cream"
              }`}
            >
              Mark as done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
