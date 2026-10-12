import { Stack } from "expo-router";
import { useThemeColor } from "../../theme";

export default function OnboardingLayout() {
  const cream = useThemeColor("cream", "#FFF8EC");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: cream },
      }}
    />
  );
}