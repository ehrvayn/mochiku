import { ReactNode, useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, AppState, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const ROTATE_MS = 4500;
const ARROW_SIZE = 44;

export type StatusCarouselProps = {
  ids: string[];
  accessibilityLabels: Record<string, string>;
  render: (index: number) => ReactNode;
  autoRotate?: boolean;
  onInteraction?: () => void;
};

export default function StatusCarousel({
  ids,
  accessibilityLabels,
  render,
  autoRotate = true,
  onInteraction,
}: StatusCarouselProps) {
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = ids.length;

  const go = useCallback(
    (direction: number) => {
      setTouched(true);
      onInteraction?.();
      setIndex((prev) => ((prev + direction) % count + count) % count);
    },
    [count, onInteraction],
  );

  useEffect(() => {
    if (count <= 1 || !autoRotate || touched || reduceMotion) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => setIndex((prev) => (prev + 1) % count), ROTATE_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();
    const sub = AppState.addEventListener("change", (status) => {
      status === "active" ? start() : stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [count, autoRotate, touched, reduceMotion]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  return (
    <View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabels[ids[index]]}
        accessibilityHint={
          count > 1
            ? "Use the arrow buttons to see other status updates."
            : undefined
        }
        accessibilityLiveRegion="polite"
      >
        {render(index)}
      </View>

      {count > 1 && (
        <View style={styles.controls}>
          <ArrowButton direction={-1} onPress={() => go(-1)} />

          <View
            style={styles.dots}
            accessibilityRole="tablist"
            accessibilityLabel={`Page ${index + 1} of ${count}`}
          >
            {ids.map((id, i) => (
              <View
                key={id}
                style={[styles.dot, i === index ? styles.dotActive : styles.dotIdle]}
              />
            ))}
          </View>

          <ArrowButton direction={1} onPress={() => go(1)} />
        </View>
      )}
    </View>
  );
}

function ArrowButton({
  direction,
  onPress,
}: {
  direction: -1 | 1;
  onPress: () => void;
}) {
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.12 }],
    opacity: 0.9 - pressed.value * 0.25,
  }));

  const isNext = direction === 1;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 140 });
      }}
      hitSlop={8}
      style={styles.arrowHit}
      accessibilityRole="button"
      accessibilityLabel={isNext ? "Next status update" : "Previous status update"}
    >
      <Animated.View style={[styles.arrow, animated]}>
        <Ionicons
          name={isNext ? "chevron-forward" : "chevron-back"}
          size={18}
          color="#FFFFFF"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  arrowHit: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 8,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  dotIdle: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});
