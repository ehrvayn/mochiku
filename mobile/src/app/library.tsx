import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import DraftStrip from "../components/DraftStrip";
import Mochiku from "../components/Mochiku";
import PhotoCard from "../components/item/PhotoCard";
import { CATEGORIES, getCategory } from "../constants/categories";
import { deleteItems, getAllItems } from "../db/items";
import { syncReminders } from "../services/notifications";
import { processPendingUploads } from "../services/upload";
import { Item } from "../types/item";

export default function Library() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState("All");
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => getAllItems().then(setItems), []);

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setPicked(new Set());
  }, []);

  const drafts = useMemo(
    () => items.filter((i) => i.status === "uploaded"),
    [items],
  );
  const processedItems = useMemo(
    () => items.filter((i) => i.status !== "uploaded"),
    [items],
  );

  useFocusEffect(
    useCallback(() => {
      load();
      processPendingUploads().then((count) => {
        if (count > 0) load();
      });
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (selecting) {
          exitSelection();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [load, selecting, exitSelection]),
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: processedItems.length };
    CATEGORIES.forEach((c) => (result[c.label] = 0));
    processedItems.forEach((i) => {
      result[getCategory(i.category).label] += 1;
    });
    return result;
  }, [processedItems]);

  const filtered = useMemo(
    () =>
      selected === "All"
        ? processedItems
        : processedItems.filter(
            (i) => getCategory(i.category).label === selected,
          ),
    [processedItems, selected],
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
      await load();
      exitSelection();
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-cream">
        <View className="px-5" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between mb-1">
            {selecting ? (
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={exitSelection}
                  className="w-10 h-10 rounded-full bg-paper border border-line items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#2B2438" />
                </TouchableOpacity>
                <Text className="text-xl font-heading text-ink">
                  {picked.size} selected
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                {items.length !== 0 && (
                  <Mochiku mood={"idle"} height={60} width={60} />
                )}
                <View>
                  <Text className="text-3xl font-display text-ink">
                    Library
                  </Text>
                  <Text className="text-xs font-body-medium text-ink-faint">
                    {items.length === 0
                      ? "Nothing stored yet"
                      : `${items.length} ${items.length === 1 ? "thing" : "things"} remembered`}
                  </Text>
                </View>
              </View>
            )}

            {selecting ? (
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleAll}
                  className="h-10 px-4 rounded-full bg-paper border border-line items-center justify-center"
                >
                  <Text className="text-sm font-body-bold text-brand-ink">
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
              items.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelecting(true)}
                  className="h-9 px-3.5 flex-row items-center gap-1 rounded-full bg-paper border border-line"
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={15}
                    color="#C2531A"
                  />
                  <Text className="text-xs font-body-bold text-brand-ink">
                    Select
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View className="mt-4">
          <DraftStrip items={drafts} />
        </View>

        {items.length > 0 && (
          <View
            className="pl-5 pb-4"
            style={{ flexDirection: "row", flexWrap: "wrap" }}
          >
            {["All", ...CATEGORIES.map((c) => c.label)].map((label) => {
              const active = selected === label;
              const cat = CATEGORIES.find((c) => c.label === label);
              return (
                <TouchableOpacity
                  key={label}
                  activeOpacity={0.7}
                  onPress={() => setSelected(label)}
                  style={{
                    backgroundColor: active
                      ? cat
                        ? cat.bg
                        : "#2B2438"
                      : "transparent",
                    borderColor: active
                      ? cat
                        ? cat.fg
                        : "#2B2438"
                      : "#E7E0D0",
                  }}
                  className="flex-row items-center gap-1.5 px-3.5 h-9 rounded-full border mr-2 mb-2"
                >
                  <Text
                    style={{
                      color: active ? (cat ? cat.fg : "#fff") : "#2B2438",
                    }}
                    className="text-sm font-body-bold"
                  >
                    {label}
                  </Text>
                  <Text
                    style={{
                      color: active
                        ? cat
                          ? cat.fg
                          : "rgba(255,255,255,0.8)"
                        : "#A39DB0",
                    }}
                    className="text-xs font-body-bold"
                  >
                    {counts[label]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          extraData={[selecting, picked]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ paddingHorizontal: 20, gap: 12 }}
          contentContainerStyle={{ paddingBottom: 160 }}
          ListEmptyComponent={
            <View className="items-center gap-3 pt-16 px-10">
              <Mochiku mood="sleeping" height={200} width={200} />
              <Text className="text-base font-heading text-ink-soft text-center mt-2">
                {items.length === 0
                  ? "Nothing to remember yet"
                  : `Nothing in ${selected.toLowerCase()} yet`}
              </Text>
              <Text className="text-sm font-body-medium text-ink-faint text-center">
                {items.length === 0 &&
                  "Snap a bill, a flyer, anything, Mochiku will hold onto it for you"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <PhotoCard
                item={item}
                isPicked={picked.has(item.id)}
                selecting={selecting}
                onPress={() => handlePress(item)}
                onLongPress={() => handleLongPress(item)}
              />
            </View>
          )}
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
