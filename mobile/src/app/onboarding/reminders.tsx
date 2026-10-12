import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";
import { updateUser } from "../../db/user";
import { useThemeColor } from "../../theme";

function toHHMM(date: Date) {
  const h = `${date.getHours()}`.padStart(2, "0");
  const m = `${date.getMinutes()}`.padStart(2, "0");
  return `${h}:${m}`;
}

export default function Reminders() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const brandInk = useThemeColor("brand-ink", "#C2531A");

  const handleChange = (
    _event: unknown,
    selected?: Date,
  ) => {
    if (Platform.OS === "android") setShowAndroidPicker(false);
    if (selected) setTime(selected);
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateUser({ reminder_time: toHHMM(time) });
      router.push("/onboarding/permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingShell
        step={2}
        total={4}
        mood="thinking"
        say="Once I know a deadline, I'll nudge you before and during the that day until it's handled. When should I reach you?"
        ctaLabel="Continue"
        onCta={handleContinue}
        loading={saving}
      >
      <View className="mt-8">
        <Text className="text-xs font-body-bold text-brand-ink mb-2">
          Reminder time
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAndroidPicker(true)}
          className="bg-paper rounded-2xl px-4 py-3.5 border border-line flex-row items-center justify-between"
        >
          {Platform.OS === "ios" ? (
            <DateTimePicker
              value={time}
              mode="time"
              display="compact"
              onChange={handleChange}
              style={{ alignSelf: "flex-start" }}
            />
          ) : (
            <Text className="text-base font-body-medium text-ink">
              {time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
          <Ionicons name="time-outline" size={18} color={brandInk} />
        </TouchableOpacity>

        {Platform.OS !== "ios" && showAndroidPicker && (
          <DateTimePicker
            value={time}
            mode="time"
            onChange={handleChange}
          />
        )}
      </View>
      </OnboardingShell>
    </>
  );
}