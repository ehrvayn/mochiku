import { Text, View } from "react-native";
import Mochiku, { Mood } from "../Mochiku";

export default function ExpensesEmptyState({
  title = "Nothing to add up yet",
  body = "Snap a bill or receipt and I'll keep the monthly total for you.",
  mood = "sleeping",
  compact = false,
}: {
  title?: string;
  body?: string;
  mood?: Mood;
  compact?: boolean;
}) {
  const size = compact ? 170 : 200;

  return (
    <View className="items-center gap-3 pt-16 px-10">
      <Mochiku mood={mood} height={size} width={size} />
      <Text className="text-base font-heading text-ink-soft text-center mt-2">
        {title}
      </Text>
      <Text className="text-sm font-body-medium text-ink-faint text-center">
        {body}
      </Text>
    </View>
  );
}
