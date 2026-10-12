import { Text, TouchableOpacity, View } from "react-native";
import { softShadow } from "../constants/tones";
import Mochiku from "./Mochiku";

type AllowAccessProps = {
  onAllow: () => void;
};

/**
 * Shared camera + notification permission prompt. Used both by the
 * onboarding flow and by the camera screen's own fallback, so it renders
 * nothing but content — the host screen owns layout and safe area.
 */
export function AllowAccess({ onAllow }: AllowAccessProps) {
  return (
    <View className="flex-1 items-center justify-center gap-8 px-7">
      <View className="flex-row items-center self-stretch">
        <View className="items-center justify-center">
          <Mochiku mood="worried" height={124} width={116} />
        </View>

        <View className="flex-1 justify-center">
          <View
            className="relative rounded-3xl p-4 bg-paper border border-line"
            style={softShadow}
          >
            <Text className="text-sm font-heading text-ink leading-snug">
              mochiku needs your camera to scan your images, and notifications
              to remind you before something's due.
            </Text>
            <View className="absolute -left-2 top-6 w-3 h-3 rotate-45 bg-paper border-l border-b border-line" />
          </View>
        </View>
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