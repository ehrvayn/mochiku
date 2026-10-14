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

  const handleValueChange = (_event: unknown, selected: Date) => {
    if (Platform.OS === "android") setShowAndroidPicker(false);
    setTime(selected);
  };

  const handleDismiss = () => {
    if (Platform.OS === "android") setShowAndroidPicker(false);
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
        say="When something has a deadline, I'll nudge you the day before and on the day itself, until it's handled. What time should I reach you?"
        ctaLabel="Continue"
        onCta={handleContinue}
        loading={saving}
        onBack={() => router.back()}
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
                onValueChange={handleValueChange}
                onDismiss={handleDismiss}
                style={{ alignSelf: "flex-start" }}
              />
            ) : (
              <Text className="text-base font-body-medium text-ink">
                {time.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            )}
            <Ionicons name="time-outline" size={18} color={brandInk} />
          </TouchableOpacity>

          {Platform.OS !== "ios" && showAndroidPicker && (
            <DateTimePicker
              value={time}
              mode="time"
              onValueChange={handleValueChange}
              onDismiss={handleDismiss}
            />
          )}
        </View>
      </OnboardingShell>
    </>
  );
}
