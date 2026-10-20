import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import EditableHeader from "../../components/item/Editableheader";
import FieldRow, { formatKey } from "../../components/item/Fieldrow";
import ReviewBanner from "../../components/item/Reviewbanner";
import ImageSection from "../../components/item/ImageSection";
import ItemActionsMenu from "../../components/item/ItemActionsMenu";
import DeleteItemModal from "../../components/modal/DeleteItemModal";
import { getCategory, useCategoryColors } from "../../constants/categories";
import { getTone, softShadow } from "../../constants/tones";
import {
  confirmItem,
  deleteItem,
  getItemById,
  getItemFields,
  updateItem,
  updateItemField,
  updateItemStatus,
} from "../../db/items";
import { daysUntil } from "../../hooks/useScheduleData";
import {
  removeFromLibraryCache,
  resyncAfterStatusChange,
} from "../../store/appCache";
import { syncReminders } from "../../services/notifications";
import { useThemeColor } from "../../theme";
import { ItemField } from "../../types/item";

const LOW_CONFIDENCE = 0.7;

export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cream = useThemeColor("cream", "#FFF8EC");
  const ink = useThemeColor("ink", "#2B2438");
  const categoryColors = useCategoryColors();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDeadline, setEditedDeadline] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: () => getItemById(id),
    enabled: !!id,
  });

  const { data: fields, isLoading: fieldsLoading } = useQuery<ItemField[]>({
    queryKey: ["itemFields", id],
    queryFn: () => getItemFields(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (fields) {
      const initial: Record<number, string> = {};
      fields.forEach((f) => {
        initial[f.id] = f.value ?? "";
      });
      setEditedValues(initial);
    }
  }, [fields]);

  useEffect(() => {
    if (item) {
      setEditedTitle(item.title ?? "");
      setEditedDeadline(item.deadline_at ? new Date(item.deadline_at) : null);
    }
  }, [item]);

  if (itemLoading || fieldsLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View className="flex-1 items-center justify-center bg-cream">
          <Text className="text-ink-faint font-body-medium">
            Loading details...
          </Text>
        </View>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Stack.Screen options={{ title: "Not found" }} />
        <View className="flex-1 items-center justify-center bg-cream">
          <Text className="text-ink-soft font-body-medium">
            Item not found.
          </Text>
        </View>
      </>
    );
  }

  const isOverdue = item.deadline_at
    ? new Date(item.deadline_at) < new Date(Date.now())
    : false;

  const needsReview = item.status === "pending_review" && !isOverdue;
  const fieldsEditable = needsReview || isEditing;

  const tone = item.deadline_at ? getTone(daysUntil(item.deadline_at)) : null;
  const category = getCategory(item.category);
  const cat = categoryColors[category.label];

  const isLow = (f: ItemField) =>
    f.confidence !== null &&
    f.confidence < LOW_CONFIDENCE &&
    !f.user_edited &&
    (editedValues[f.id] ?? "") === (f.value ?? "");

  const deadlineLow =
    needsReview &&
    (item.deadline_confidence ?? 1) < LOW_CONFIDENCE &&
    !!item.deadline_at &&
    editedDeadline?.getTime() === new Date(item.deadline_at).getTime();

  const lowLabels = Array.from(
    new Set([
      ...(deadlineLow ? ["Deadline"] : []),
      ...(fields ?? []).filter(isLow).map((f) => formatKey(f.key)),
    ]),
  );

  const handleSave = async () => {
    if (!fields || isSaving) return;
    setIsSaving(true);
    try {
      await updateItem(id, {
        title: editedTitle.trim() || null,
        deadline: editedDeadline ? editedDeadline.toISOString() : null,
      });

      for (const field of fields) {
        const newValue = editedValues[field.id];
        if (newValue !== undefined && newValue !== (field.value ?? "")) {
          await updateItemField(field.id, newValue);
        }
      }

      if (editedDeadline) {
        await confirmItem(id);
      } else if (item.status === "pending_review") {
        await updateItemStatus(id, "stored");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["item", id] }),
        queryClient.invalidateQueries({ queryKey: ["itemFields", id] }),
      ]);
      // Status just changed, so this item moves between Library's Saved and
      // Drafts tabs and may enter Schedule's upcoming list.
      resyncAfterStatusChange();
      await syncReminders();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteItem(id);
      await syncReminders();
      setShowDelete(false);
      router.back();
      queryClient.removeQueries({ queryKey: ["item", id] });
      queryClient.removeQueries({ queryKey: ["itemFields", id] });
      removeFromLibraryCache([id]);
    } catch {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: needsReview ? "Review Snap" : "Item Details",
          headerStyle: { backgroundColor: cream },
          headerShadowVisible: false,
          headerTintColor: ink,
          headerTitleStyle: { fontFamily: "Nunito_800ExtraBold" },
          headerRight: () => (
            <>
              {!needsReview && isEditing ? (
                <TouchableOpacity
                  className="px-4"
                  onPress={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                >
                  <Text className="text-lg dark:text-white font-body-bold self-center">{isSaving ? "saving..." : "save"}</Text>
                </TouchableOpacity>
              ) : (
                <ItemActionsMenu
                  title={item.title ?? "Untitled"}
                  canEdit={!needsReview}
                  busyAction={isSaving ? "save" : isDeleting ? "delete" : null}
                  onEdit={() => setIsEditing(true)}
                  onExport={() =>
                    router.push({
                      pathname: "/item/[id]/preview",
                      params: { id },
                    })
                  }
                  onDelete={() => setShowDelete(true)}
                />
              )}
            </>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-cream"
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {needsReview && <ReviewBanner labels={lowLabels} reviewing />}

        {item.local_image_uri && <ImageSection uri={item.local_image_uri} />}

        {fieldsEditable ? (
          <View
            className="bg-paper border border-line rounded-3xl p-5"
            style={softShadow}
          >
            <EditableHeader
              title={editedTitle}
              onTitleChange={setEditedTitle}
              deadline={editedDeadline}
              onDeadlineChange={setEditedDeadline}
              deadlineLow={deadlineLow}
            />
          </View>
        ) : (
          <View className="gap-3 px-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <View
                className="flex-row items-center gap-1.5 rounded-full px-3 py-1 border border-line"
                style={{ backgroundColor: cat.bg }}
              >
                <Ionicons name={category.icon} size={12} color={cat.fg} />
                <Text
                  className="text-xs font-body-bold"
                  style={{ color: cat.fg }}
                >
                  {category.label}
                </Text>
              </View>
              {tone && (
                <View
                  className={`${tone.box} rounded-full px-3 py-1 border border-line/20`}
                >
                  <Text className={`text-xs font-body-bold ${tone.text}`}>
                    {tone.label}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-2xl font-display text-ink">
              {item.title ?? "Untitled"}
            </Text>
            {item.deadline_at && (
              <Text className="text-xs font-body-medium text-ink-soft">
                Due: {new Date(item.deadline_at).toDateString()}
              </Text>
            )}
          </View>
        )}

        {!needsReview && <ReviewBanner labels={lowLabels} reviewing={false} />}

        {fields && fields.length > 0 && (
          <View
            className="bg-paper rounded-3xl p-5 border border-line gap-4"
            style={softShadow}
          >
            <Text className="text-base font-heading text-ink">
              Extracted Information
            </Text>
            <View className="gap-3.5">
              {fields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  value={editedValues[field.id] ?? ""}
                  editable={fieldsEditable}
                  low={isLow(field)}
                  onChange={(text) =>
                    setEditedValues((prev) => ({ ...prev, [field.id]: text }))
                  }
                />
              ))}
            </View>
          </View>
        )}

        {needsReview && (
          <TouchableOpacity
            className="w-full bg-brand py-4 rounded-full items-center justify-center mt-2"
            style={softShadow}
            activeOpacity={0.85}
            disabled={isSaving}
            onPress={handleSave}
          >
            <Text className="text-white font-heading text-base">
              {isSaving
                ? "Saving..."
                : lowLabels.length > 0
                  ? "Confirm Details Anyway"
                  : "Confirm & Save"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DeleteItemModal
        visible={showDelete}
        deleting={isDeleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
