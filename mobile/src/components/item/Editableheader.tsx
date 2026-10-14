import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../theme";

export default function EditableHeader({
  title,
  onTitleChange,
  deadline,
  onDeadlineChange,
  deadlineLow,
}: {
  title: string;
  onTitleChange: (text: string) => void;
  deadline: Date | null;
  onDeadlineChange: (date: Date) => void;
  deadlineLow: boolean;
}) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");
  const soonInk = useThemeColor("soon-ink", "#9A6400");

  const handleValueChange = (_event: unknown, date: Date) => {
    setShowAndroidPicker(false);
    onDeadlineChange(date);
  };

  const handleDismiss = () => {
    setShowAndroidPicker(false);
  };

  return (
    <View className="gap-4">
      <View className="gap-1.5">
        <Text className="text-xs font-body-bold text-ink-soft uppercase tracking-wider">
          Title
        </Text>
        <TextInput
          className="text-lg font-heading text-ink bg-cream/60 border border-line rounded-2xl px-4 py-3"
          value={title}
          onChangeText={onTitleChange}
          placeholder="Untitled"
          placeholderTextColor={inkFaint}
        />
      </View>

      <View className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-body-bold text-ink-soft uppercase tracking-wider">
            Deadline
          </Text>
          {deadlineLow && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="help-circle-outline" size={14} color={soonInk} />
              <Text className="text-xs font-body-bold text-soon-ink">
                Double-check date
              </Text>
            </View>
          )}
        </View>

        {deadline ? (
          <TouchableOpacity onPress={() => setShowAndroidPicker(true)}>
            <View
              className={`flex-row items-center justify-between rounded-2xl px-4 py-3 border ${
                deadlineLow
                  ? "bg-soon-soft border-dashed border-soon"
                  : "bg-cream/60 border-line"
              }`}
            >
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="compact"
                  onValueChange={handleValueChange}
                  onDismiss={handleDismiss}
                />
              ) : (
                <>
                  <Text className="text-base font-body-medium text-ink">
                    {deadline.toDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={brandInk} />
                  {showAndroidPicker && (
                    <DateTimePicker
                      value={deadline}
                      mode="date"
                      onValueChange={handleValueChange}
                      onDismiss={handleDismiss}
                    />
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-cream/40 border border-dashed border-brand/40 rounded-2xl px-4 py-3.5 items-center justify-center flex-row gap-2"
            onPress={() => onDeadlineChange(new Date())}
          >
            <Ionicons name="add-circle-outline" size={18} color={brandInk} />
            <Text className="text-sm font-body-bold text-brand">
              Add deadline
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
