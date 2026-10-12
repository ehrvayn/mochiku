import { Stack } from "expo-router";

export default function OnboardingLayout() {
  // No back gestures during onboarding: the steps write to the user row in
  // order, so swiping backwards would let someone skip a save.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#FFF8EC" },
      }}
    />
  );
}