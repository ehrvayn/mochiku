import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { getUser } from "../db/user";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mood } from "../components/Mochiku";
import {
  DeadlineGroup,
  MascotHeader,
  NextUpCard,
  ReviewCard,
  SectionHeader,
} from "../components/home/HomeParts";
import { DeadlineEntry, useHomeData } from "../hooks/useHomeData";
import HomeSkeleton from "../components/home/HomeSkeleton";
import StatusCarousel from "../components/home/StatusCarousel";
import { useThemeColor } from "../theme";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";

type StatusItem = { id: string; message: ReactNode; mood: Mood };

/**
 * Plain-text versions of each status for screen readers. The visible copy is
 * JSX, so it can't be announced meaningfully on its own.
 */
const STATUS_ACCESSIBILITY_LABELS: Record<string, string> = {
  "hero-urgent": "Urgent: a deadline is due today or tomorrow.",
  overdue: "Overdue: one or more items are past their deadline.",
  pending: "Needs review: some photos have details to confirm.",
  week: "Status: deadlines scheduled this week.",
  "hero-idle": "Status: nothing urgent coming up.",
  empty: "Status: no deadlines yet. Snap a photo to get started.",
};

function getStates(s: {
  hero: DeadlineEntry | null;
  overdueCount: number;
  weekCount: number;
  pendingCount: number;
  name?: string;
}): StatusItem[] {
  const states: StatusItem[] = [];

  const greet = (text: string): ReactNode =>
    s.name ? (
      <>
        Hey <Text className="font-body-bold text-base">{s.name}</Text>, {text}
      </>
    ) : (
      text.charAt(0).toUpperCase() + text.slice(1)
    );

  if (s.hero && s.hero.days <= 1) {
    states.push({
      id: "hero-urgent",
      message:
        s.hero.days === 0
          ? "Clock's ticking! Something needs your attention today."
          : "Heads up! You have a deadline landing tomorrow.",
      mood: "worried",
    });
  }

  if (s.overdueCount > 0) {
    states.push({
      id: "overdue",
      message: `${s.overdueCount} item${s.overdueCount > 1 ? "s slipped past" : " slipped past"}. Let's clear ${s.overdueCount > 1 ? "them" : "it"} out first!`,
      mood: "worried",
    });
  }

  if (s.pendingCount > 0) {
    states.push({
      id: "pending",
      message: `I spotted ${s.pendingCount} photo${s.pendingCount === 1 ? "" : "s"} with fuzzy details. Mind double-checking?`,
      mood: "confused",
    });
  }

  if (s.weekCount > 0) {
    states.push({
      id: "week",
      message: greet(
        `looking solid! ${s.weekCount} item${s.weekCount === 1 ? "" : "s"} scheduled for this week.`,
      ),
      mood: "happy",
    });
  }

  if (states.length === 0) {
    if (s.hero) {
      states.push({
        id: "hero-idle",
        message: greet(
          `smooth sailing! Nothing urgent until ${s.hero.days} days from now.`,
        ),
        mood: "happy",
      });
    } else {
      states.push({
        id: "empty",
        message: greet(
          "no deadlines coming up. Snap a photo and I'll catch the dates!",
        ),
        mood: "sleeping",
      });
    }
  }

  return states;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const {
    pending,
    hero,
    groups,
    overdueCount,
    weekCount,
    refreshing,
    refresh,
    isLoading,
  } = useHomeData();
  const brand = useThemeColor("brand", "#FF8A4C");

  const [name, setName] = useState("");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let cancelled = false;
    getUser().then((user) => {
      if (!cancelled && user?.name && user.name !== "Friend") {
        setName(user.name);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const states = useMemo(
    () =>
      getStates({
        hero,
        overdueCount,
        weekCount,
        pendingCount: pending.length,
        name,
      }),
    [hero, overdueCount, weekCount, pending.length, name],
  );

  const isEmpty = !hero && pending.length === 0 && groups.length === 0;
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <HomeSkeleton isDark={isDark} />
      </>
    );
  }

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 128,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={brand}
            colors={[brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View
          className={`mb-5 pb-1 rounded-b-[40px] px-5 justify-center ${isDark ? "bg-brand-deep" : "bg-brand"}`}
          style={{ paddingTop: insets.top + 10, minHeight: insets.top + 116 }}
        >
          <StatusCarousel
            ids={states.map((s) => s.id)}
            accessibilityLabels={STATUS_ACCESSIBILITY_LABELS}
            render={(index) => {
              const state = states[index];
              return (
                <Animated.View
                  key={state.id}
                  entering={FadeIn.duration(260)}
                  exiting={FadeOut.duration(140)}
                >
                  <MascotHeader message={state.message} mood={state.mood} />
                </Animated.View>
              );
            }}
          />
        </View>

        {hero && (
          <View className="px-5 mb-6">
            <NextUpCard entry={hero} />
          </View>
        )}

        {pending.length > 0 && (
          <View className="mb-8">
            <SectionHeader
              title="To Confirm"
              subtitle="Check the uncertainties from these photos"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {pending.map((item) => (
                <ReviewCard key={item.id} item={item} />
              ))}
            </ScrollView>
          </View>
        )}

        {groups.length > 0 && (
          <View className="space-y-4">
            <SectionHeader title="Upcoming" />
            {groups.map((g) => (
              <DeadlineGroup key={g.title} title={g.title} items={g.items} />
            ))}
          </View>
        )}

        {!isLoading && isEmpty && (
          <View
            className={`mx-5 my-8 p-6 rounded-3xl border border-line dark:border-line-dark items-center justify-center ${isDark ? "bg-paper-dark/60" : "bg-white/70"}`}
          >
            <View className="w-12 h-12 rounded-full bg-brand-soft justify-center items-center mb-3">
              <Ionicons name="calendar-clear-outline" size={22} color={brand} />
            </View>
            <Text className="text-base font-heading text-ink dark:text-ink-dark text-center mb-1">
              No deadlines yet
            </Text>
            <Text className="text-xs font-body-medium text-ink-faint dark:text-ink-faint-dark text-center max-w-[240px]">
              Anything you scan that has a due date will show up here. Your
              other saved items are in the Library.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
