import { router, Stack } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";
import { updateUser } from "../../db/user";

export default function Name() {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && !saving;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    try {
      await updateUser({ name: trimmed });
      router.push("/onboarding/reminders");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingShell
        step={1}
        total={4}
        mood="idle"
        say="What should I call you? I'll use your name so a reminder feels like a nudge from a friend, not a stranger."
        ctaLabel="Continue"
        onCta={handleContinue}
        ctaDisabled={!canContinue}
        loading={saving}
      >
        <View className="mt-8">
          <TextInput
            className="text-lg font-body-medium text-ink bg-paper rounded-2xl px-4 py-4 border border-line"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#A39DB0"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={handleContinue}
            maxLength={40}
          />
        </View>
      </OnboardingShell>
    </>
  );
}