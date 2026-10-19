import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getUser } from "../db/user";
import {
  BackHandler,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Mood } from "../components/Mochiku";
import MarkAsDoneModal from "../components/modal/MarkAsDoneModal";
import MarkDoneBar from "../components/schedule/MarkDoneBar";
import ScanExamples from "../components/schedule/ScanExamples";
import {
  DeadlineGroup,
  MascotHeader,
  NextUpCard,
  ReviewCard,
  SectionHeader,
} from "../components/schedule/ScheduleParts";
import { DeadlineEntry, useScheduleData } from "../hooks/useScheduleData";
import { markItemsDone } from "../db/items";
import { syncReminders } from "../services/notifications";
import { resyncAfterStatusChange } from "../store/appCache";
import { Item } from "../types/item";
import {
  isMascotLang,
  mascotMessages,
  type MascotLang,
  type MascotMessages,
} from "../constants/i18n";
import ScheduleSkeleton from "../components/schedule/ScheduleSkeleton";
import StatusCarousel from "../components/schedule/StatusCarousel";
import WeekStrip from "../components/schedule/WeekStrip";
import { useThemeColor } from "../theme";
import { useColorScheme } from "nativewind";
import { ReactNode } from "react";

type StatusItem = { id: string; message: ReactNode; mood: Mood };

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const STATUS_ACCESSIBILITY_LABELS: Record<string, string> = {
  "hero-urgent": "Urgent: a deadline is due today or tomorrow.",
  overdue: "Overdue: one or more items are past their deadline.",
  pending: "Needs review: some photos have details to confirm.",
  week: "Status: deadlines scheduled this week.",
  "hero-idle": "Status: nothing urgent coming up.",
  empty: "Status: no deadlines yet. Snap a photo to get started.",
};

function getStates(
  s: {
    hero: DeadlineEntry | null;
    overdueCount: number;
    weekCount: number;
    pendingCount: number;
  },
  t: MascotMessages,
): StatusItem[] {
  const states: StatusItem[] = [];

  const greet = t.greet;

  if (s.hero && s.hero.days <= 1) {
    states.push({
      id: "hero-urgent",
      message: s.hero.days === 0 ? cap(t.heroToday) : cap(t.heroTomorrow),
      mood: "worried",
    });
  }

  if (s.overdueCount > 0) {
    states.push({
      id: "overdue",
      message: cap(t.overdue(s.overdueCount)),
      mood: "worried",
    });
  }

  if (s.pendingCount > 0) {
    states.push({
      id: "pending",
      message: cap(t.pending(s.pendingCount)),
      mood: "confused",
    });
  }

  if (s.weekCount > 0) {
    states.push({
      id: "week",
      message: greet(t.week(s.weekCount)),
      mood: "happy",
    });
  }

  if (states.length === 0) {
    if (s.hero) {
      states.push({
        id: "hero-idle",
        message: greet(t.heroIdle(s.hero.days)),
        mood: "happy",
      });
    } else {
      states.push({
        id: "empty",
        message: greet(t.empty()),
        mood: "sleeping",
      });
    }
  }

  return states;
}

export default function Schedule() {
  const insets = useSafeAreaInsets();
  const {
    pending,
    upcoming,
    hero,
    groups,
    overdueCount,
    weekCount,
    refreshing,
    refresh,
    isLoading,
  } = useScheduleData();
  const brand = useThemeColor("brand", "#FF8A4C");
  const queryClient = useQueryClient();
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showMarkDone, setShowMarkDone] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [name, setName] = useState("");
  const [lang, setLang] = useState<MascotLang>("en");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getUser().then((user) => {
        if (cancelled) return;
        if (user?.name && user.name !== "Friend") setName(user.name);
        if (isMascotLang(user?.mascot_lang)) setLang(user.mascot_lang);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const messages = useMemo(() => mascotMessages(lang, name), [lang, name]);

  const states = useMemo(
    () =>
      getStates(
        {
          hero,
          overdueCount,
          weekCount,
          pendingCount: pending.length,
        },
        messages,
      ),
    [hero, overdueCount, weekCount, pending.length, messages],
  );

  const deadlineItems = useMemo(
    () =>
      hero
        ? [hero.item, ...groups.flatMap((g) => g.items.map((e) => e.item))]
        : [],
    [hero, groups],
  );

  const allPicked =
    deadlineItems.length > 0 && deadlineItems.every((i) => picked.has(i.id));

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setPicked(new Set());
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selecting) {
        exitSelection();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selecting, exitSelection]);

  const togglePick = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () =>
    setPicked(allPicked ? new Set() : new Set(deadlineItems.map((i) => i.id)));

  const handlePress = (item: Item) => {
    if (selecting) togglePick(item.id);
    else router.push({ pathname: "/item/[id]", params: { id: item.id } });
  };

  const handleLongPress = (item: Item) => {
    if (!selecting) {
      setSelecting(true);
      setPicked(new Set([item.id]));
    }
  };

  const handleMarkDone = async () => {
    if (isMarking || picked.size === 0) return;
    setIsMarking(true);
    try {
      const ids = Array.from(picked);
      await markItemsDone(ids, true);
      await syncReminders();
      ids.forEach((id) => {
        queryClient.removeQueries({ queryKey: ["item", id] });
        queryClient.removeQueries({ queryKey: ["itemFields", id] });
      });
      resyncAfterStatusChange();
      exitSelection();
    } finally {
      setIsMarking(false);
      setShowMarkDone(false);
    }
  };

  const pickedTitle = useMemo(() => {
    const first = deadlineItems.find((i) => picked.has(i.id));
    return first?.title ?? null;
  }, [deadlineItems, picked]);

  const isEmpty = !hero && pending.length === 0 && groups.length === 0;
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ScheduleSkeleton isDark={isDark} />
      </>
    );
  }

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className={`mb-2 pb-1 rounded-b-[36px] px-5 justify-center ${isDark ? "bg-brand-deep" : "bg-brand"}`}
        style={{ paddingTop: insets.top + 6, minHeight: insets.top + 86 }}
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 128,
          flexGrow: 1,
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
        <WeekStrip items={upcoming} disabled={selecting} />

        {isEmpty ? (
          <View className="flex-1 justify-center px-5 pb-24">


            <ScanExamples />
            <Text className="text-xs self-center mt-4 text-center font-body-medium text-ink-faint dark:text-ink-faint-dark leading-relaxed">
              Anything Mochiku saves without a date keeps in Library.
            </Text>
          </View>
        ) : (
          <View>

            <MarkDoneBar
              selecting={selecting}
              pickedCount={picked.size}
              allPicked={allPicked}
              onExit={exitSelection}
              onToggleAll={toggleAll}
              onConfirm={() => setShowMarkDone(true)}
            />

            {hero && (
              <View className="px-5 mt-6 mb-7">
                <NextUpCard
                  entry={hero}
                  selecting={selecting}
                  isPicked={picked.has(hero.item.id)}
                  onPress={() => handlePress(hero.item)}
                  onLongPress={() => handleLongPress(hero.item)}
                />
              </View>
            )}

            {pending.length > 0 && (
              <View className="mb-9">
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
              <View className="space-y-5 mt-2">
                {groups.map((g) => (
                  <DeadlineGroup
                    key={g.title}
                    title={g.title}
                    items={g.items}
                    selecting={selecting}
                    picked={picked}
                    onPress={handlePress}
                    onLongPress={handleLongPress}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <MarkAsDoneModal
        visible={showMarkDone}
        marking={isMarking}
        count={picked.size}
        title={pickedTitle}
        onCancel={() => setShowMarkDone(false)}
        onConfirm={handleMarkDone}
      />
    </View>
  );
}
