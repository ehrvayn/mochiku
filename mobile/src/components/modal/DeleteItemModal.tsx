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
  deleting: boolean;
  count?: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteItemModal({
  visible,
  deleting,
  count = 1,
  onCancel,
  onConfirm,
}: Props) {
  const plural = count > 1;
  const urgentInk = useThemeColor("urgent-ink", "#C73E37");
  const cream = useThemeColor("cream", "#FFF8EC");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={deleting ? undefined : onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View className="w-full bg-paper rounded-3xl p-6 items-center gap-4 border border-line">
          <View className="w-14 h-14 rounded-full bg-urgent-soft items-center justify-center">
            <Ionicons name="trash-outline" size={26} color={urgentInk} />
          </View>

          <View className="items-center gap-1.5">
            <Text className="text-xl font-bold text-ink">
              {plural ? `Delete ${count} items?` : "Delete item?"}
            </Text>
            <Text className="text-sm text-ink-soft text-center">
              {plural
                ? "These items and their details will be permanently removed. This can't be undone."
                : "This will permanently remove it and its details. This can't be undone."}
            </Text>
          </View>

          <View className="w-full flex-row gap-3 mt-2">
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={deleting}
              onPress={onCancel}
              className="flex-1 py-3.5 rounded-xl bg-cream border border-line items-center"
            >
              <Text className="text-ink-soft font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={deleting}
              onPress={onConfirm}
              className="flex-1 py-3.5 rounded-xl bg-urgent items-center justify-center"
            >
              {deleting ? (
                <ActivityIndicator color={cream} />
              ) : (
                <Text className="text-cream font-semibold text-base">
                  Delete
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
