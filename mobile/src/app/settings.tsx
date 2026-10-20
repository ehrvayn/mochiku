import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateUser, getUser, parseNotifyCategories } from "../db/user";
import CategoryFilterChips from "../components/settings/CategoryFilterChips";
import { isMascotLang, MASCOT_LANGS, type MascotLang } from "../constants/i18n";
import { syncReminders } from "../services/notifications";
import { isDarkPreferred, storeAppearance, useThemeColor } from "../theme";
import {
  beginThemeToggleProbe,
  endThemeToggleProbe,
} from "../store/themeProbe";

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

type SettingsSnapshot = {
  time: Date;
  categories: Set<string> | null;
  lang: MascotLang;
};

function settingsKey(
  time: Date,
  categories: Set<string> | null,
  lang: MascotLang,
) {
  return [
    toHHMM(time),
    categories === null ? "all" : [...categories].sort().join(","),
    lang,
  ].join("|");
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(() => parseHHMM("09:00"));
  const [showPicker, setShowPicker] = useState(false);
  const [dark, setDark] = useState(isDarkPreferred);
  const [categories, setCategories] = useState<Set<string> | null>(null);
  const [lang, setLang] = useState<MascotLang>("en");
  const [loaded, setLoaded] = useState(false);
  const lastSaved = useRef<string | null>(null);
  const pending = useRef<SettingsSnapshot | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const brandColor = useThemeColor("brand", "#FF8A4C");
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const lineColor = useThemeColor("line", "#F0E4CF");

  const persist = useCallback((snapshot: SettingsSnapshot) => {
    const key = settingsKey(
      snapshot.time,
      snapshot.categories,
      snapshot.lang,
    );

    saveQueue.current = saveQueue.current.then(async () => {
      try {
        await updateUser({
          reminder_time: toHHMM(snapshot.time),
          notify_categories:
            snapshot.categories === null ? null : [...snapshot.categories],
          mascot_lang: snapshot.lang,
        });
        await syncReminders();
        lastSaved.current = key;
      } catch (error) {
        console.log("settings autosave failed:", error);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUser().then((user) => {
      if (cancelled || !user) return;

      const nextTime = parseHHMM(user.reminder_time);
      const nextCategories = parseNotifyCategories(user.notify_categories);
      const nextLang = isMascotLang(user.mascot_lang) ? user.mascot_lang : "en";

      setTime(nextTime);
      setCategories(nextCategories);
      setLang(nextLang);
      lastSaved.current = settingsKey(nextTime, nextCategories, nextLang);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const key = settingsKey(time, categories, lang);
    if (key === lastSaved.current) {
      pending.current = null;
      return;
    }

    pending.current = {
      time: new Date(time),
      categories,
      lang,
    };

    const timer = setTimeout(() => {
      const snapshot = pending.current;
      pending.current = null;
      if (snapshot) persist(snapshot);
    }, 300);

    return () => clearTimeout(timer);
  }, [loaded, time, categories, lang, persist]);

  useEffect(() => {
    return () => {
      const snapshot = pending.current;
      pending.current = null;
      if (snapshot) persist(snapshot);
    };
  }, [persist]);

  const handleValueChange = (_e: unknown, selected: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    setTime(selected);
  };

  const handleDismiss = () => {
    if (Platform.OS === "android") setShowPicker(false);
  };

  const handleDarkChange = (next: boolean) => {
    beginThemeToggleProbe(`settings -> ${next ? "dark" : "light"}`);
    setDark(next);
    storeAppearance(next ? "dark" : "light");
    endThemeToggleProbe();
  };

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="mb-6 flex flex-row justify-between rounded-b-[50px] px-8 bg-brand dark:bg-brand-deep"
        style={{ paddingTop: insets.top + 14, paddingBottom: 20 }}
      >
        <View>
          <Text className="text-3xl font-display text-white">Settings</Text>
          <Text className="text-xs font-body-medium text-white/80">
            How Mochiku should behave
          </Text>
        </View>
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
              thumbColor="white"
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
              onValueChange={handleValueChange}
              onDismiss={handleDismiss}
              style={{ alignSelf: "flex-start" }}
            />
          ) : (
            <Text className="text-base font-body-medium text-ink dark:text-ink-dark">
              {time.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          )}
          <Ionicons name="time-outline" size={18} color={brandInk} />
        </TouchableOpacity>

        {Platform.OS !== "ios" && showPicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            onValueChange={handleValueChange}
            onDismiss={handleDismiss}
          />
        )}

        <Text className="text-xs font-body-bold text-brand-ink dark:text-brand mt-5 mb-2">
          Remind me about
        </Text>
        <View className="mb-6">
          <CategoryFilterChips
            selected={categories}
            onChange={(next) => {
              setCategories(next);
            }}
          />
        </View>

        <Text className="text-xs font-body-bold text-brand-ink dark:text-brand mb-2">
          Mochiku's language
        </Text>
        <View className="bg-paper dark:bg-paper-dark rounded-2xl border border-line dark:border-line-dark overflow-hidden mb-6">
          {MASCOT_LANGS.map((l, i) => (
            <View key={l.code}>
              {i > 0 && <View className="h-px bg-line dark:bg-line-dark" />}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setLang(l.code);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: lang === l.code }}
                className="px-4 py-3.5 flex-row items-center justify-between"
              >
                <Text className="text-base font-body-medium text-ink dark:text-ink-dark">
                  {l.label}
                </Text>
                {lang === l.code && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={brandInk}
                  />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Text className="text-xs font-body text-ink-faint dark:text-ink-faint-dark mb-6">
          This changes what Mochiku says when he greets you. The rest of the app
          stays in English.
        </Text>
      </View>
    </View>
  );
}
