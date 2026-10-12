import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Mochiku from "../components/Mochiku";
import { softShadow } from "../constants/tones";
import { getUser } from "../db/user";

export default function Profile() {
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 128,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="mb-6 bg-brand rounded-b-[50px] px-5 items-center gap-4"
          style={{ paddingBottom: 28 }}
        >
          <Mochiku mood="happy" height={140} width={132} />

          <View
            className="relative rounded-3xl p-4 bg-paper border border-line self-stretch"
            style={softShadow}
          >
            <Text className="text-sm font-heading text-ink text-center leading-snug">
              Hi, I&apos;m {firstName}. Mochiku keeps your shelf tidy.
            </Text>
          </View>
        </View>

        <View className="px-5">
          <View className="bg-paper rounded-2xl border border-line overflow-hidden">
            <Row
              icon="person-outline"
              label="Name"
              value={user?.name || "—"}
            />
            <View className="h-px bg-line" />
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
              color="#A39DB0"
              style={{ marginTop: 1 }}
            />
            <Text className="text-xs font-body text-ink-faint flex-1">
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
  return (
    <View className="flex-row items-center justify-between px-4 py-4">
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={18} color="#C2531A" />
        <Text className="text-sm font-body-medium text-ink-soft">{label}</Text>
      </View>
      <Text className="text-sm font-body-bold text-ink">{value}</Text>
    </View>
  );
}