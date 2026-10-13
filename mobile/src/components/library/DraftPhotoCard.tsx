import { ActivityIndicator, View } from "react-native";
import PhotoCard from "../item/PhotoCard";
import { useThemeColor } from "../../theme";
import { Item } from "../../types/item";

export default function DraftPhotoCard({ item }: { item: Item }) {
  const brand = useThemeColor("brand", "#FF8A4C");

  const draft: Item = { ...item};

  return (
    <View
      className="opacity-60"
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => {}}
    >
      <View className="pointer-events-none">
        <PhotoCard
          item={draft}
          isPicked={false}
          onPress={() => {}}
          onLongPress={() => {}}
          isOnDrafts={true}
        />
      </View>

      <View
        pointerEvents="none"
        className="absolute top-0 left-0 right-0 items-center justify-center"
        style={{ height: "60%" }}
      >
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
        >
          <ActivityIndicator size="large" color={brand} />
        </View>
      </View>
    </View>
  );
}
