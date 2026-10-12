import { router, Stack } from "expo-router";
import Storage from "expo-sqlite/kv-store";
import { useState } from "react";
import { Text, View } from "react-native";
import { useCameraPermissions } from "expo-camera";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";
import { updateUser } from "../../db/user";
import {
  getNotificationPermissionStatus,
  registerForNotificationsAsync,
  syncReminders,
} from "../../services/notifications";

const ASKED_KEY = "access_asked";

export default function Permissions() {
  const [, requestPermission] = useCameraPermissions();
  const [granting, setGranting] = useState(false);

  const handleFinish = async () => {
    if (granting) return;
    setGranting(true);
    try {
      await requestPermission();
      await registerForNotificationsAsync();
      const notif = await getNotificationPermissionStatus();
      if (notif === "granted") syncReminders();

      Storage.setItemSync(ASKED_KEY, "1");
      await updateUser({ onboarding_completed: true });
      router.replace("/");
    } finally {
      setGranting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingShell
        step={3}
        total={4}
        mood="happy"
        say="Last thing, I need permission to snap photos and send reminders. Without them I can't do much."
        ctaLabel="Allow access"
        onCta={handleFinish}
        loading={granting}
      >
        <View className="mt-8 items-center">
          <Text className="text-xs font-body text-ink-faint text-center max-w-[260px]">
            You can change this anytime in your device settings.
          </Text>
        </View>
      </OnboardingShell>
    </>
  );
}