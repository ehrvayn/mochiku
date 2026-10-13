import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateUser, getUser } from "../db/user";
import {
  isDarkPreferred,
  storeAppearance,
  useThemeColor,
} from "../theme";
import { useColorScheme } from "nativewind";

function parseHHMM(value: string | undefined) {
  const d = new Date();
  const [h, m] = (value ?? "09:00").split(":").map(Number);
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function toHHMM(date: Date) {
  const h = `${date.getHours()}`.padStart(2, "0");
  const m = `${date.getMinutes()}`.padStart(2, "0");
  return `${h}:${m}`;
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(() => parseHHMM("09:00"));
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [dark, setDark] = useState(isDarkPreferred);
  const brandColor = useThemeColor("brand", "#FF8A4C");
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const lineColor = useThemeColor("line", "#F0E4CF");
  const paper = useThemeColor("paper", "#FFFFFF");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let cancelled = false;
    getUser().then((user) => {
      if (!cancelled && user) setTime(parseHHMM(user.reminder_time));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (_e: unknown, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) {
      setTime(selected);
      setSaved(false);
    }
  };

  const handleSave = async () => {
    await updateUser({ reminder_time: toHHMM(time) });
    setSaved(true);
  };

  const handleDarkChange = (next: boolean) => {
    setDark(next);
    storeAppearance(next ? "dark" : "light");
  };

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="mb-6 rounded-b-[50px] px-5 bg-brand dark:bg-brand-deep"
        style={{ paddingTop: insets.top + 16, paddingBottom: 28 }}
      >
        <Text className="text-3xl font-display text-white">Settings</Text>
        <Text className="text-xs font-body-medium text-white/80">
          How Mochiku should behave
        </Text>
      </View>

      <View
        className="flex-1 px-5"
        style={{ paddingBottom: insets.bottom + 128 }}
      >
        <View className="mb-6">
          <Text className="text-xs font-body-bold text-brand-ink dark:text-brand mb-2">
            Dark mode
          </Text>

          <View className="bg-paper dark:bg-paper-dark rounded-2xl px-4 py-3.5 border border-line dark:border-line-dark flex-row items-center justify-between">
            <Text className="text-base font-body-medium text-ink dark:text-ink-dark">
              {dark ? "On" : "Off"}
            </Text>
            <Switch
              value={dark}
              onValueChange={handleDarkChange}
              trackColor={{ false: lineColor, true: brandColor }}
              thumbColor={paper}
              ios_backgroundColor={lineColor}
            />
          </View>
        </View>

        <Text className="text-xs font-body-bold text-brand-ink dark:text-brand mb-2">
          Reminder time
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowPicker(true)}
          className="bg-paper dark:bg-paper-dark rounded-2xl px-4 py-3.5 border border-line dark:border-line-dark flex-row items-center justify-between"
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
            <Text className="text-base font-body-medium text-ink dark:text-ink-dark">
              {time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
          <Ionicons name="time-outline" size={18} color={brandInk} />
        </TouchableOpacity>

        {Platform.OS !== "ios" && showPicker && (
          <DateTimePicker value={time} mode="time" onChange={handleChange} />
        )}

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          className="mt-4 w-full py-4 rounded-full bg-brand dark:bg-brand-deep items-center"
        >
          <Text className="text-white font-heading text-base">
            {saved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>

        <Text className="text-xs font-body text-ink-faint dark:text-ink-faint-dark mt-4">
          Mochiku nudges you on this time each day while something is still
          open.
        </Text>
      </View>
    </View>
  );
}