import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeleteItemModal from "../components/modal/DeleteItemModal";
import Mochiku from "../components/Mochiku";
import CategoryChips from "../components/library/CategoryChips";
import DraftPhotoCard from "../components/library/DraftPhotoCard";
import LibrarySubnav, { LibraryTab } from "../components/library/LibrarySubnav";
import {
  DraftsEmptyState,
  LibraryEmptyState,
} from "../components/library/LibraryEmptyStates";
import PhotoCard from "../components/item/PhotoCard";
import { CATEGORIES, getCategory } from "../constants/categories";
import { deleteItems } from "../db/items";
import {
  LIBRARY_KEY,
  refreshLibrary,
  removeFromLibraryCache,
  type LibraryData,
} from "../store/appCache";
import { useCacheEntry } from "../store/cache";
import {
  beginThemeToggleProbe,
  endThemeToggleProbe,
} from "../store/themeProbe";
import { syncReminders } from "../services/notifications";
import { processPendingUploads } from "../services/upload";
import { useThemeColor } from "../theme";
import { Item } from "../types/item";
import { useColorScheme } from "nativewind";
import LibrarySkeleton from "../components/library/LibrarySkeleton";

/** Polling cadence while the Drafts tab is open, so finished uploads move
 *  from Drafts to Saved without a manual pull-to-refresh. */
const DRAFTS_POLL_MS = 4000;

/** Stable empty array so derived memos below do not churn. */
const EMPTY_ITEMS: Item[] = [];

export default function Library() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();
  const ink = useThemeColor("ink", "#2B2438");
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  const { data: cachedItems, settled } = useCacheEntry<LibraryData>(LIBRARY_KEY);

  const [tab, setTab] = useState<LibraryTab>("saved");
  const [selected, setSelected] = useState("All");
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // True only until the very first load settles; false immediately when the
  // cache is already warm from a previous visit.
  const isLoading = !settled;
  const items = cachedItems ?? EMPTY_ITEMS;

  const load = useCallback(() => refreshLibrary(), []);

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setPicked(new Set());
  }, []);

  const drafts = useMemo(
    () => items.filter((i) => i.status === "uploaded"),
    [items],
  );
  const saved = useMemo(
    () => items.filter((i) => i.status !== "uploaded"),
    [items],
  );

  useFocusEffect(
    useCallback(() => {
      // Diagnostic: measure the cost of this screen's color subscriptions.
      beginThemeToggleProbe(`library focus (${items.length} items)`);
      load();
      processPendingUploads().then((count) => {
        if (count > 0) load();
      });
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        // Selection mode only exists on the Saved tab.
        if (selecting) {
          exitSelection();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [load, selecting, exitSelection, items.length]),
  );

  useEffect(() => {
    endThemeToggleProbe();
  }, [items.length]);

  // Keep retrying pending uploads while the Drafts tab is open. The interval
  // is torn down as soon as the tab changes, so it only ever runs on Drafts.
  useEffect(() => {
    if (tab !== "drafts") return;
    const id = setInterval(() => {
      // Reload regardless of the result: the item may have finished on the
      // server without this client being the one to observe the transition.
      processPendingUploads().finally(() => load());
    }, DRAFTS_POLL_MS);
    return () => clearInterval(id);
  }, [tab, load]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: saved.length };
    CATEGORIES.forEach((c) => (result[c.label] = 0));
    saved.forEach((i) => {
      result[getCategory(i.category).label] += 1;
    });
    return result;
  }, [saved]);

  const filtered = useMemo(
    () =>
      selected === "All"
        ? saved
        : saved.filter((i) => getCategory(i.category).label === selected),
    [saved, selected],
  );

  const allPicked =
    filtered.length > 0 && filtered.every((i) => picked.has(i.id));

  const togglePick = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () =>
    setPicked(allPicked ? new Set() : new Set(filtered.map((i) => i.id)));

  const handleTabChange = (next: LibraryTab) => {
    setTab(next);
    setSelected("All");
    if (next !== "saved") exitSelection();
  };

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

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const ids = Array.from(picked);
      await deleteItems(ids);
      await syncReminders();
      ids.forEach((id) => {
        queryClient.removeQueries({ queryKey: ["item", id] });
        queryClient.removeQueries({ queryKey: ["itemFields", id] });
      });
      // Drop them from the cache now so a refocus cannot show deleted rows.
      removeFromLibraryCache(ids);
      await load();
      exitSelection();
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  const onDrafts = tab === "drafts";
  const totalCount = items.length;

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LibrarySkeleton isDark={isDark} />
      </>
    );
  }

  const header = (
    <View
      className={`rounded-b-[50px] px-5 pb-4 ${
        isDark ? "bg-brand-deep" : "bg-brand"
      }`}
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between mb-1">
        {selecting ? (
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={exitSelection}
              className="w-10 h-10 rounded-full bg-paper dark:bg-paper-dark border border-line dark:border-line-dark items-center justify-center"
            >
              <Ionicons name="close" size={20} color={ink} />
            </TouchableOpacity>
            <Text className="text-xl font-heading text-white">
              {picked.size} selected
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1">
            {items.length !== 0 && (
              <Mochiku mood="idle" height={50} width={50} />
            )}
            <View className={`${items.length === 0 && "pl-5"}`}>
              <Text className="text-3xl font-display text-white">Library</Text>
              <Text className="text-xs font-body-medium text-white/80">
                {totalCount === 0
                  ? "Nothing stored yet"
                  : `${totalCount} ${totalCount === 1 ? "thing" : "things"} remembered`}
              </Text>
            </View>
          </View>
        )}

        {selecting ? (
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleAll}
              className="h-10 px-4 rounded-full bg-paper dark:bg-paper-dark border border-line dark:border-line-dark items-center justify-center"
            >
              <Text className="text-sm font-body-bold text-brand-ink dark:text-brand">
                {allPicked ? "Clear" : "Select all"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={picked.size === 0}
              onPress={() => setShowDelete(true)}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                picked.size === 0 ? "bg-urgent-soft" : "bg-urgent"
              }`}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          !onDrafts &&
          saved.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelecting(true)}
              className="h-9 px-3.5 flex-row items-center gap-1 rounded-full bg-paper dark:bg-paper-dark border border-line dark:border-line-dark"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={15}
                color={brandInk}
              />
              <Text className="text-xs font-body-bold text-brand-ink dark:text-brand">
                Select
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <View className="mt-3">
        <LibrarySubnav
          tab={tab}
          onChange={handleTabChange}
          draftCount={drafts.length}
        />
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-cream dark:bg-night">
        {header}

        {!onDrafts && saved.length > 0 && (
          <View className="mt-4 pb-4">
            <CategoryChips
              counts={counts}
              selected={selected}
              onSelect={setSelected}
            />
          </View>
        )}

        <FlatList
          data={onDrafts ? drafts : filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          extraData={[selecting, picked, onDrafts]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ paddingHorizontal: 20, gap: 12 }}
          contentContainerStyle={{ paddingBottom: 160 }}
          className={`${onDrafts && "mt-3"}`}
          ListEmptyComponent={
            onDrafts ? (
              <DraftsEmptyState />
            ) : (
              <LibraryEmptyState
                nothingAtAll={items.length === 0}
                filterLabel={selected}
              />
            )
          }
          // Never reached while loading: the skeleton short-circuits above,
          // so an empty list here is always genuinely empty.
          renderItem={({ item }) =>
            onDrafts ? (
              <View style={{ width: cardWidth }}>
                <DraftPhotoCard item={item} />
              </View>
            ) : (
              <View style={{ width: cardWidth }}>
                <PhotoCard
                  item={item}
                  isPicked={picked.has(item.id)}
                  selecting={selecting}
                  onPress={() => handlePress(item)}
                  onLongPress={() => handleLongPress(item)}
                />
              </View>
            )
          }
        />
      </View>

      <DeleteItemModal
        visible={showDelete}
        deleting={isDeleting}
        count={picked.size}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
