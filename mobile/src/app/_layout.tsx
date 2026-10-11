import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import FloatingNav from "../components/FloatingNav";
import { useEffect, useState } from "react";
import { syncReminders } from "../services/notifications";
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
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

const introVideoSource = require("../../assets/vid/Mochiku-intro.mp4");

export default function RootLayout() {
  const [loaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const [showIntro, setShowIntro] = useState(true);

  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const player = useVideoPlayer(introVideoSource, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();

    const sub = player.addListener("playToEnd", () => {
      opacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(setShowIntro)(false);
      });
    });

    return () => sub.remove();
  }, [loaded, player]);

  useEffect(() => {
    syncReminders();
  }, []);

  if (!loaded) return null;

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Animated.View style={[styles.introContent, animatedStyle]}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
          <Text style={styles.brandText}>MOCHIKU</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{ contentStyle: { backgroundColor: "#FFF8EC" } }}
          />
          <FloatingNav />
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    backgroundColor: "#FF8A4C",
    alignItems: "center",
    justifyContent: "center",
  },
  introContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  video: {
    width: 160,
    height: 160,
    backgroundColor: "transparent",
  },
  brandText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 24,
    color: "#FFF8EC",
    letterSpacing: 4,
  },
});
