import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { getCategory } from "../../constants/categories";
import { getTone } from "../../constants/tones";
import { daysUntil } from "../../hooks/useHomeData";
import { Item } from "../../types/item";

export default function PhotoCard({
  item,
  isPicked,
  onPress,
  onLongPress,
}: {
  item: Item;
  isPicked: boolean;
  selecting?: boolean;
  tall?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const cat = getCategory(item.category);
  const tone = item.deadline_at ? getTone(daysUntil(item.deadline_at)) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      className={`bg-paper rounded-3xl overflow-hidden border-2 mb-3 ${
        isPicked ? "border-brand" : "border-line"
      }`}
    >
      <View>
        <Image
          source={{ uri: item.local_image_uri }}
          style={{ width: "100%", aspectRatio: 3 / 4 }}
          className={isPicked ? "opacity-60" : ""}
          resizeMode="cover"
        />

        {tone && (
          <View
            className={`absolute top-2 left-2 rounded-full px-2.5 py-1 ${tone.box}`}
          >
            <Text className={`text-[11px] font-body-bold ${tone.text}`}>
              {tone.label}
            </Text>
          </View>
        )}

        {isPicked && (
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-10 h-10 rounded-full bg-brand items-center justify-center">
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
          </View>
        )}
      </View>

      <View className="p-3 gap-1.5">
        <Text className="text-sm font-heading text-ink" numberOfLines={2}>
          {item.title ?? "Untitled"}
        </Text>
        <View
          className="flex-row items-center gap-1 rounded-full px-2 py-0.5 self-start"
          style={{ backgroundColor: cat.bg }}
        >
          <Ionicons name={cat.icon} size={11} color={cat.fg} />
          <Text
            className="text-[11px] font-body-bold"
            style={{ color: cat.fg }}
          >
            {cat.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
