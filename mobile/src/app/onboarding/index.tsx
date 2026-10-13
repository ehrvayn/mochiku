import { router } from "expo-router";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";

export default function Welcome() {
  return (
    <OnboardingShell
      step={0}
      total={4}
      mood="happy"
      say="Hi, I'm Mochiku! Snap anything you'll want later, like a bill, a flyer, or an assignment. I'll read it, keep it organized, and remind you if there's a due date."
      ctaLabel="Get started"
      onCta={() => router.push("/onboarding/name")}
    />
  );
}
