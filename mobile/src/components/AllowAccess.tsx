import { Stack } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Mochiku from "./Mochiku";

type AllowAccessProps = {
  onAllow: () => void;
};

export function AllowAccess({ onAllow }: AllowAccessProps) {
  return (
    <View className="flex-1 bg-cream items-center justify-center px-8 gap-6">
      <Stack.Screen options={{ headerShown: false }} />
      <Mochiku mood="worried" height={200} width={130} />

      <View className="items-center gap-2">
        <Text className="text-2xl font-display text-ink">
          Allow camera & notifications
        </Text>
        <Text className="text-sm font-body text-ink-soft text-center">
          mochiku needs your camera to scan your images, and notifications to
          remind you before something's due.
        </Text>
      </View>

      <TouchableOpacity
        onPress={onAllow}
        activeOpacity={0.85}
        className="w-full bg-brand py-4 rounded-full items-center"
      >
        <Text className="text-white font-heading text-base">Allow access</Text>
      </TouchableOpacity>
    </View>
  );
}
