import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, View } from "react-native";
import { useThemeColor } from "../../theme";
import { ItemField } from "../../types/item";

export const formatKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function FieldRow({
  field,
  value,
  editable,
  low,
  onChange,
}: {
  field: ItemField;
  value: string;
  editable: boolean;
  low: boolean;
  onChange: (text: string) => void;
}) {
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");
  const soonInk = useThemeColor("soon-ink", "#9A6400");

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-body-bold text-ink-faint">
          {formatKey(field.key)}
        </Text>
        {low && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="alert-circle-outline" size={13} color={soonInk} />
            <Text className="text-[11px] font-body-bold text-soon-ink">
              Check this
            </Text>
          </View>
        )}
      </View>

      {editable ? (
        <TextInput
          className={`text-sm font-body-medium text-ink rounded-2xl px-4 py-3 border ${
            low
              ? "bg-soon-soft border-dashed border-soon"
              : "bg-cream/60 border-line"
          }`}
          value={value}
          onChangeText={onChange}
          placeholder="Unspecified"
          placeholderTextColor={inkFaint}
        />
      ) : (
        <View
          className={`rounded-2xl px-4 py-3 ${
            low ? "bg-soon-soft border border-dashed border-soon" : "bg-cream/40 border border-line/40"
          }`}
        >
          <Text className="text-sm font-body-medium text-ink">
            {field.value || "—"}
          </Text>
        </View>
      )}
    </View>
  );
}