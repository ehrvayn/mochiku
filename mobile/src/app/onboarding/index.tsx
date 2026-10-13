import { router } from "expo-router";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";

export default function Welcome() {
  return (
    <OnboardingShell
      step={0}
      total={4}
      mood="happy"
      say="Hi! I'm Mochiku. Snap a photo of a bill, a receipt, or a notice and I'll read it and remind you before it's due."
      ctaLabel="Get started"
      onCta={() => router.push("/onboarding/name")}
    />
  );
}