import "../global.css";
import { Redirect, Stack, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import FloatingNav from "../components/FloatingNav";
import { useEffect, useRef, useState } from "react";
import { syncReminders } from "../services/notifications";
import { ensureLocalUser } from "../db/user";
import { Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { colorScheme as nativeColorScheme, useColorScheme } from "nativewind";
import {
  applyStoredAppearance,
  readStoredAppearance,
  useThemeColor,
} from "../theme";
import { refreshHome, refreshLibrary } from "../store/appCache";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();
applyStoredAppearance();

const introVideoSource = require("../../assets/vid/Mochiku-intro.mp4");

// Module scope, so it survives a remount of the root layout. This layout
// returns early (intro, blank while the user query resolves, Redirect) which
// unmounts the navigator, and expo-router remounts the layout afterwards.
// With component state that reset showIntro to true and replayed the intro.
let introDoneThisSession = false;

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const cream = useThemeColor("cream", "#FFF8EC");
  const brand = useThemeColor("brand", "#FF8A4C");
  const [loaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const [showIntro, setShowIntro] = useState(() => !introDoneThisSession);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const segments = useSegments();
  const inOnboarding = segments[0] === "onboarding";

  const lightLocked = showIntro || inOnboarding;
  useEffect(() => {
    nativeColorScheme.set(lightLocked ? "light" : readStoredAppearance());
  }, [lightLocked]);

  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const finishIntro = () => {
    introDoneThisSession = true;
    setShowIntro(false);
  };

  const player = useVideoPlayer(introVideoSource, (p) => {
    p.loop = false;
    // Don't autoplay on a remount after the intro already ran this session.
    if (!introDoneThisSession) p.play();
  });

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();

    const sub = player.addListener("playToEnd", () => {
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(finishIntro)();
      });
    });

    return () => sub.remove();
  }, [loaded, player]);

  useEffect(() => {
    syncReminders();

    void refreshHome();
    void refreshLibrary();

    ensureLocalUser()
      .then((user) => {
        setNeedsOnboarding(!user?.onboarding_completed);
      })
      .catch(() => {
        setNeedsOnboarding(false);
      });
  }, []);

  const prevInOnboarding = useRef(inOnboarding);
  const justLeftOnboarding = prevInOnboarding.current && !inOnboarding;
  prevInOnboarding.current = inOnboarding;

  useEffect(() => {
    if (needsOnboarding === null || inOnboarding || !justLeftOnboarding) return;
    let cancelled = false;
    ensureLocalUser()
      .then((user) => {
        if (!cancelled) setNeedsOnboarding(!user?.onboarding_completed);
      })
      .catch(() => {
        if (!cancelled) setNeedsOnboarding(false);
      });
    return () => {
      cancelled = true;
    };
  }, [needsOnboarding, inOnboarding, justLeftOnboarding]);

  if (!loaded) return null;

  if (showIntro) {
    return (
      <View style={[styles.introContainer, { backgroundColor: brand }]}>
        <Animated.View style={[styles.introContent, animatedStyle]}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
          <Text style={styles.brandText}>
            MOCHIKU
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (needsOnboarding === null) return null;

  if (needsOnboarding && !inOnboarding && !justLeftOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1 }}>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ contentStyle: { backgroundColor: cream } }}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
          <FloatingNav />
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  introContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  video: {
    width: 160,
    height: 160,
    backgroundColor: "transparent",
  },
  brandText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 40,
    color: "#FFF8EC",
    letterSpacing: 10,
  },
});
