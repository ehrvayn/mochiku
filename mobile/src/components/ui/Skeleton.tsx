import { ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useThemeColor } from "../../theme";

/**
 * A single pulsing placeholder block.
 *
 * Colours come from the theme's `line` token over a `paper` surface, so it
 * adapts to dark mode without hard-coded grays. Radius defaults to `rounded-2xl`
 * so it matches the card language used across the app.
 */
export default function Skeleton({
  className = "",
  style,
  pulse = true,
  ...rest
}: ViewProps & { pulse?: boolean }) {
  const pulseTo = useThemeColor("line", "#F0E4CF");

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!pulse) return;
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`rounded-2xl ${className}`}
      style={[{ backgroundColor: pulseTo }, animatedStyle, style]}
      {...rest}
    />
  );
}

/**
 * Convenience wrapper for a run of text lines, so screen skeletons stay short.
 */
export function SkeletonLines({
  count = 2,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 rounded-full ${className}`}
          style={{ width: i === count - 1 ? "60%" : "100%" }}
        />
      ))}
    </>
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton className="rounded-full" style={{ width: size, height: size }} />;
}