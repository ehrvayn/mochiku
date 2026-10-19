import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../theme";

type Props = {
  visible: boolean;
  marking: boolean;
  count: number;
  /** Shown instead of the generic copy when exactly one item is selected. */
  title?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function MarkAsDoneModal({
  visible,
  marking,
  count,
  title,
  onCancel,
  onConfirm,
}: Props) {
  const plural = count > 1;
  const calmInk = useThemeColor("calm-ink", "#3F8F6B");
  const cream = useThemeColor("cream", "#FFF8EC");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={marking ? undefined : onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View className="w-full bg-paper dark:bg-paper-dark rounded-3xl p-6 items-center gap-4 border border-line dark:border-line-dark">
          <View className="w-14 h-14 rounded-full bg-calm-soft items-center justify-center">
            <Ionicons name="checkmark-circle-outline" size={26} color={calmInk} />
          </View>

          <View className="items-center gap-1.5">
            <Text className="text-xl font-heading text-ink dark:text-ink-dark text-center">
              {plural ? `Mark ${count} items as done?` : "Mark as done?"}
            </Text>
            {!plural && !!title && (
              <Text className="text-sm text-ink-soft dark:text-ink-soft-dark text-center">
                &quot;{title}&quot;
              </Text>
            )}
            <Text className="text-xs text-ink-faint dark:text-ink-faint-dark text-center">
              {plural
                ? "They will leave your schedule list and stop reminding you."
                : "It will leave your schedule list and stop reminding you."}
            </Text>
          </View>

          <View className="w-full flex-row gap-3 mt-2">
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={marking}
              onPress={onCancel}
              className="flex-1 py-3.5 rounded-xl bg-cream dark:bg-night border border-line dark:border-line-dark items-center"
            >
              <Text className="text-ink-soft font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={marking}
              onPress={onConfirm}
              className="flex-1 py-3.5 rounded-xl bg-calm items-center justify-center"
            >
              {marking ? (
                <ActivityIndicator color={cream} />
              ) : (
                <Text className="text-cream font-semibold text-base">
                  Mark as done
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}