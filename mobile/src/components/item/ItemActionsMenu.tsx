import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { softShadow } from "../../constants/tones";
import { useThemeColor } from "../../theme";

type BusyAction = "save" | "delete" | null;

type Props = {
  title: string;
  canEdit: boolean;
  busyAction: BusyAction;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
};

type MenuRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function MenuRow({
  icon,
  label,
  danger = false,
  loading = false,
  disabled = false,
  onPress,
}: MenuRowProps) {
  const inkSoft = useThemeColor("ink-soft", "#6B647A");
  const urgentInk = useThemeColor("urgent-ink", "#C73E37");
  const brandInk = useThemeColor("brand-ink", "#C2531A");

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center gap-3 px-2 py-3 rounded-2xl ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          danger ? "bg-urgent-soft" : "bg-brand-soft"
        }`}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={danger ? urgentInk : brandInk}
          />
        ) : (
          <Ionicons
            name={icon}
            size={19}
            color={danger ? urgentInk : brandInk}
          />
        )}
      </View>
      <Text
        className={`flex-1 text-base font-body-medium ${
          danger ? "text-urgent-ink" : "text-ink"
        }`}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={17} color={inkSoft} />
    </TouchableOpacity>
  );
}

export default function ItemActionsMenu({
  title,
  canEdit,
  busyAction,
  onEdit,
  onExport,
  onDelete,
}: Props) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const ink = useThemeColor("ink", "#2B2438");

  const close = () => setVisible(false);

  const run = (action: () => void) => {
    close();
    setTimeout(action, 250);
  };

  const busy = busyAction !== null;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={busy}
        onPress={() => setVisible(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Item actions"
        className="p-1.5"
      >
        {busy ? (
          <ActivityIndicator size="small" color={ink} />
        ) : (
          <Ionicons name="menu-outline" size={25} color={ink} />
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={close} />

          <View
            className="bg-paper rounded-t-3xl border-t border-line px-4 pt-3"
            style={[{ paddingBottom: insets.bottom + 16 }, softShadow]}
          >
            <View className="w-10 h-1 rounded-full bg-line self-center mb-4" />

            <Text className="text-xs font-body-bold text-ink-soft uppercase tracking-wider px-2">
              Item actions
            </Text>
            <Text
              className="text-lg font-heading text-ink px-2 mt-1 mb-2"
              numberOfLines={1}
            >
              {title}
            </Text>

            {canEdit && (
              <MenuRow
                icon={"pencil-outline"}
                label={"Edit item"}
                loading={busyAction === "save"}
                disabled={busy}
                onPress={() => run(onEdit)}
              />
            )}

            <MenuRow
              icon="share-outline"
              label="Export & Share"
              disabled={busy}
              onPress={() => run(onExport)}
            />

            <View className="h-px bg-line/60 mx-2 my-1" />

            <MenuRow
              icon="trash-outline"
              label={busyAction === "delete" ? "Deleting..." : "Delete item"}
              danger
              loading={busyAction === "delete"}
              disabled={busy}
              onPress={() => run(onDelete)}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={busy}
              onPress={close}
              className="mt-1 py-3.5 rounded-2xl bg-cream border border-line items-center"
            >
              <Text className="text-ink-soft font-body-bold text-base">
                Cancel
              </Text>
            </TouchableOpacity>

            <View className="h-1" />
          </View>
        </View>
      </Modal>
    </>
  );
}
