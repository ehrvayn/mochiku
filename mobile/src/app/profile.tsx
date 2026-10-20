import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { router, usePathname } from "expo-router";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MascotMessage from "../components/MascotMessage";
import Mochiku from "../components/Mochiku";
import { softShadow } from "../constants/tones";
import { getUser, updateUser } from "../db/user";
import {
  isMascotLang,
  mascotMessages,
  type MascotLang,
} from "../constants/i18n";
import { useThemeColor } from "../theme";
import { useColorScheme } from "nativewind";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const [user, setUser] = useState<{
    name: string;
    reminder_time: string;
    mascot_lang: MascotLang;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUser().then((row) => {
      if (cancelled || !row) return;
      setUser({
        name: row.name,
        reminder_time: row.reminder_time,
        mascot_lang: isMascotLang(row.mascot_lang) ? row.mascot_lang : "en",
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const beginEdit = () => {
    setDraftName(user?.name ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraftName("");
  };

  const handleSaveName = async () => {
    const next = draftName.trim();
    if (!next || isSavingName) return;
    setIsSavingName(true);
    try {
      await updateUser({ name: next });
      setUser((prev) => (prev ? { ...prev, name: next } : prev));
      setEditing(false);
    } catch (error) {
      console.log("rename failed:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  const firstName = user?.name?.split(" ")[0] || "Friend";

  const profileGreeting = useMemo(
    () =>
      mascotMessages(user?.mascot_lang ?? "en", firstName).profileGreeting(
        firstName,
      ),
    [firstName, user?.mascot_lang],
  );

  const reminderLabel = (() => {
    if (!user?.reminder_time) return "—";
    const [h, m] = user.reminder_time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return "—";
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  })();

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 128,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className={`mb-6 rounded-b-[50px] px-5 justify-center ${
            isDark ? "bg-brand-deep" : "bg-brand"
          }`}
          style={{ paddingTop: insets.top + 16, paddingBottom: 28 }}
        >
          <View className="flex-row items-center gap-4">
            <View className="items-center justify-center">
              <Mochiku mood="idle" height={124} width={116} />
            </View>

            <View className="flex-1 justify-center">
              <View
                className="relative rounded-3xl p-4 bg-paper dark:bg-paper-dark border border-line dark:border-line-dark"
                style={softShadow}
              >
                <MascotMessage
                  message={profileGreeting}
                  name={firstName}
                  className="text-sm font-heading text-ink dark:text-ink-dark leading-snug"
                />
                <View className="absolute -left-2 top-6 w-3 h-3 rotate-45 bg-paper dark:bg-paper-dark border-l border-b border-line dark:border-line-dark" />
              </View>
            </View>
          </View>
        </View>

        <View className="px-5">
          <View className="bg-paper dark:bg-paper-dark rounded-2xl border border-line dark:border-line-dark overflow-hidden">
            {editing ? (
              <View className="px-4 py-4 gap-3">
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  placeholder="Your name"
                  placeholderTextColor={inkFaint}
                  maxLength={40}
                  className="text-base font-body-medium text-ink dark:text-ink-dark bg-cream dark:bg-night border border-line dark:border-line-dark rounded-xl px-3 py-2.5"
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={cancelEdit}
                    className="flex-1 py-2.5 rounded-full bg-cream dark:bg-night border border-line dark:border-line-dark items-center"
                  >
                    <Text className="text-sm font-body-bold text-ink-soft dark:text-ink-soft-dark">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={!draftName.trim() || isSavingName}
                    onPress={handleSaveName}
                    className={`flex-1 py-2.5 rounded-full items-center ${
                      !draftName.trim() || isSavingName
                        ? "bg-brand-soft"
                        : "bg-brand"
                    }`}
                  >
                    <Text
                      className={`text-sm font-body-bold ${
                        !draftName.trim() || isSavingName
                          ? "text-ink-faint"
                          : "text-cream"
                      }`}
                    >
                      {isSavingName ? "Saving…" : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={beginEdit}
                accessibilityRole="button"
                accessibilityLabel={`Name, ${user?.name || "not set"}. Tap to change.`}
                className="px-4 py-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="person-outline" size={18} color={brandInk} />
                  <Text className="text-sm font-body-medium text-ink-soft dark:text-ink-soft-dark">
                    Name
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-body-bold text-ink dark:text-ink-dark">
                    {user?.name || "—"}
                  </Text>
                  <Ionicons name="pencil-outline" size={14} color={inkFaint} />
                </View>
              </TouchableOpacity>
            )}
            <View className="h-px bg-line dark:bg-line-dark" />
            <Row
              icon="time-outline"
              label="Reminder time"
              value={reminderLabel}
            />
          </View>

          <View className="mt-4 flex-row items-start gap-2 px-1">
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={inkFaint}
              style={{ marginTop: 1 }}
            />
            <Text className="text-xs font-body text-ink-faint dark:text-ink-faint-dark flex-1">
              Everything Mochiku remembers stays on this device.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const pathname = usePathname();

  return (
    <TouchableOpacity
      onPress={() => {
        if (pathname !== "/settings") router.navigate("/settings");
      }}
      className="flex-row items-center justify-between px-4 py-4"
    >
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={18} color={brandInk} />
        <Text className="text-sm font-body-medium text-ink-soft dark:text-ink-soft-dark">
          {label}
        </Text>
      </View>
      <Text className="text-sm font-body-bold text-ink dark:text-ink-dark">
        {value}
      </Text>
    </TouchableOpacity>
  );
}
