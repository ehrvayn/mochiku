import { ReactNode } from "react";
import { Stack } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { softShadow } from "../../constants/tones";
import Mochiku, { Mood } from "../Mochiku";

type OnboardingShellProps = {
  step: number;
  total: number;
  mood: Mood;
  say: string;
  children?: ReactNode;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  loading?: boolean;
};

export function OnboardingShell({
  step,
  total,
  mood,
  say,
  children,
  ctaLabel,
  onCta,
  ctaDisabled = false,
  loading = false,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 24,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center px-6">
            <View className="items-center justify-center">
              <Mochiku mood={mood} height={124} width={116} />
            </View>

            <View className="flex-1 justify-center">
              <View
                className="relative rounded-3xl p-4 bg-paper border border-line"
                style={softShadow}
              >
                <Text className="text-sm font-heading text-ink leading-snug">
                  {say}
                </Text>
                <View className="absolute -left-2 top-6 w-3 h-3 rotate-45 bg-paper border-l border-b border-line" />
              </View>
            </View>
          </View>

          <View className="flex-1 px-6">{children}</View>

          <View className="flex-row items-center gap-1.5 mt-8 px-6">
            {Array.from({ length: total }).map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full ${
                  i === step ? "w-5 bg-brand" : "w-1.5 bg-ink/10"
                }`}
              />
            ))}
          </View>
        </ScrollView>

        <View className="px-6" style={{ paddingBottom: insets.bottom + 24 }}>
          <TouchableOpacity
            onPress={onCta}
            activeOpacity={0.85}
            disabled={ctaDisabled || loading}
            className={`w-full py-4 rounded-full items-center ${
              ctaDisabled || loading ? "bg-brand/40" : "bg-brand"
            }`}
          >
            <Text className="text-white font-heading text-base">
              {loading ? "One moment..." : ctaLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
