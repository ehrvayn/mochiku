import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Text, View } from "react-native";
import { softShadow } from "../../constants/tones";
import Mochiku, { Mood } from "../Mochiku";

function MascotBubble({
  mood,
  bubble,
  children,
}: {
  mood: Mood;
  bubble: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Mochiku mood={mood} height={140} width={100} />
      <View className="flex-1 justify-center">
        <View
          className={`relative rounded-3xl p-4 border ${bubble}`}
          style={softShadow}
        >
          {children}
          <View
            className={`absolute -left-2 top-6 w-3 h-3 rotate-45 border-l border-b ${bubble}`}
          />
        </View>
      </View>
    </View>
  );
}

export default function ReviewBanner({
  labels = [],
  reviewing = false,
}: {
  labels?: string[];
  reviewing?: boolean;
}) {
  if (labels.length === 0) {
    if (!reviewing) return null;
    return (
      <MascotBubble mood="happy" bubble="bg-paper border-line">
        <Text className="text-sm font-heading text-ink">
          Everything looks clear!
        </Text>
        <Text className="text-xs font-body-medium text-ink-faint mt-0.5">
          Tap confirm to save it to your shelf.
        </Text>
      </MascotBubble>
    );
  }

  if (!reviewing) {
    return (
      <View className="flex-row items-center gap-3 bg-soon-soft rounded-2xl p-4 border border-soon/40">
        <Ionicons name="help-circle" size={20} color="#9A6400" />
        <Text className="flex-1 text-xs font-body-bold text-soon-ink">
          {labels.length}{" "}
          {labels.length === 1 ? "detail needs" : "details need"} a quick check
        </Text>
      </View>
    );
  }

  return (
    <MascotBubble mood="confused" bubble="bg-soon-soft border-soon">
      <Text className="text-sm font-heading text-soon-ink">
        Please check {labels.length === 1 ? "this" : "these"} first
      </Text>
      <Text className="text-xs font-body-medium text-soon-ink/80 mb-2.5">
        I wasn't completely sure about {labels.length === 1 ? "it" : "them"}.
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {labels.map((label) => (
          <View
            key={label}
            className="bg-paper rounded-full px-2.5 py-1 border border-dashed border-soon"
          >
            <Text className="text-[11px] font-body-bold text-soon-ink">
              {label}
            </Text>
          </View>
        ))}
      </View>
    </MascotBubble>
  );
}
