import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Mochiku from "../components/Mochiku";
import { softShadow } from "../constants/tones";
import { getUser } from "../db/user";
import { useThemeColor } from "../theme";
import { useColorScheme } from "nativewind";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");
  const [user, setUser] = useState<{
    name: string;
    reminder_time: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUser().then((row) => {
      if (cancelled || !row) return;
      setUser({ name: row.name, reminder_time: row.reminder_time });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Friend";

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
              <Mochiku mood="happy" height={124} width={116} />
            </View>

            <View className="flex-1 justify-center">
              <View
                className="relative rounded-3xl p-4 bg-paper dark:bg-paper-dark border border-line dark:border-line-dark"
                style={softShadow}
              >
                <Text className="text-sm font-heading text-ink dark:text-ink-dark leading-snug">
                  Hi, <Text className="font-display">{firstName}.</Text> I'm
                  Mochiku and I keep your shelf tidy.
                </Text>
                <View className="absolute -left-2 top-6 w-3 h-3 rotate-45 bg-paper dark:bg-paper-dark border-l border-b border-line dark:border-line-dark" />
              </View>
            </View>
          </View>
        </View>

        <View className="px-5">
          <View className="bg-paper dark:bg-paper-dark rounded-2xl border border-line dark:border-line-dark overflow-hidden">
            <Row icon="person-outline" label="Name" value={user?.name || "—"} />
            <View className="h-px bg-line dark:bg-line-dark" />
            <Row
              icon="time-outline"
              label="Reminder time"
              value={user?.reminder_time || "—"}
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

  return (
    <View className="flex-row items-center justify-between px-4 py-4">
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={18} color={brandInk} />
        <Text className="text-sm font-body-medium text-ink-soft dark:text-ink-soft-dark">
          {label}
        </Text>
      </View>
      <Text className="text-sm font-body-bold text-ink dark:text-ink-dark">
        {value}
      </Text>
    </View>
  );
}
