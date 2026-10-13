import { Text, View } from "react-native";
import Mochiku from "../Mochiku";

export function LibraryEmptyState({
  nothingAtAll,
  filterLabel,
}: {
  nothingAtAll: boolean;
  filterLabel: string;
}) {
  return (
    <View className="items-center gap-3 pt-16 px-10">
      <Mochiku mood="sleeping" height={200} width={200} />
      <Text className="text-base font-heading text-ink-soft text-center mt-2">
        {nothingAtAll ? "Nothing to remember yet" : `Nothing in ${filterLabel.toLowerCase()} yet`}
      </Text>
      {nothingAtAll && (
        <Text className="text-sm font-body-medium text-ink-faint text-center">
          Snap a bill, a flyer, anything, Mochiku will hold onto it for you
        </Text>
      )}
    </View>
  );
}

export function DraftsEmptyState() {
  return (
    <View className="items-center gap-3 pt-16 px-10">
      <Mochiku mood="idle" height={170} width={170} />
      <Text className="text-base font-heading text-ink-soft text-center mt-2">
        No drafts right now
      </Text>
      <Text className="text-sm font-body-medium text-ink-faint text-center">
        Anything I&rsquo;m still reading will show up here
      </Text>
    </View>
  );
}