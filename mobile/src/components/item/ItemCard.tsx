import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { getCategory, useCategoryColors } from "../../constants/categories";
import { getTone } from "../../constants/tones";
import { daysUntil } from "../../hooks/useHomeData";
import { Item } from "../../types/item";

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Processing",
  pending_review: "To confirm",
  confirmed: "Confirmed",
  stored: "Stored",
};

export default function ItemCard({
  item,
  showStatus = false,
}: {
  item: Item;
  showStatus?: boolean;
}) {
  const tone = item.deadline_at ? getTone(daysUntil(item.deadline_at)) : null;
  const cat = useCategoryColors()[getCategory(item.category).label];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({ pathname: "/item/[id]", params: { id: item.id } })
      }
      className="flex-row bg-paper border border-line rounded-3xl mb-3 overflow-hidden"
    >
      <View
        className={`w-1.5 ${tone ? tone.bar : ""}`}
        style={!tone ? { backgroundColor: cat.bg } : undefined}
      />
      <View className="flex-1 p-4 gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <Text
            className="flex-1 text-base font-heading text-ink"
            numberOfLines={2}
          >
            {item.title ?? "Untitled"}
          </Text>
          {showStatus && (
            <View className="bg-cream rounded-full px-2.5 py-1">
              <Text className="text-xs font-body-bold text-ink-soft">
                {STATUS_LABELS[item.status] ?? item.status}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-body-medium text-ink-faint">
            {item.deadline_at
              ? new Date(item.deadline_at).toDateString()
              : "No deadline"}
          </Text>
          {tone && (
            <View className={`${tone.box} rounded-full px-2.5 py-1`}>
              <Text className={`text-xs font-body-bold ${tone.text}`}>
                {tone.label}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
