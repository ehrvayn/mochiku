import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Skeleton, { SkeletonCircle, SkeletonLines } from "../ui/Skeleton";

export default function ScheduleSkeleton({ isDark }: { isDark: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <View
        className={`mb-2 pb-1 rounded-b-[36px] px-5 ${
          isDark ? "bg-brand-deep" : "bg-brand"
        }`}
        style={{ paddingTop: insets.top + 6, minHeight: insets.top + 120 }}
      >
        <View className="flex-row items-center">
          <SkeletonCircle size={74} />
          <View className="flex-1 rounded-3xl p-4 ml-2 bg-paper border border-line">
            <SkeletonLines count={3} />
          </View>
        </View>
      </View>

      <View className="px-5 mb-4">
        <Skeleton className="h-3 w-20 rounded-full" />
        <View className="flex-row justify-between mt-3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} className="items-center gap-1.5">
              <Skeleton className="h-2 w-3 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-1.5 w-1.5 rounded-full" />
            </View>
          ))}
        </View>
        <Skeleton className="h-20 rounded-3xl mt-3" />
      </View>

      <View className="px-5 mb-6">
        <View
          className="flex-row bg-paper border border-line rounded-3xl overflow-hidden"
          style={{ height: 118 }}
        >
          <Skeleton className="w-28 rounded-none" />
          <View className="flex-1 p-4 justify-center gap-2">
            <Skeleton className="h-2.5 w-16 rounded-full" />
            <SkeletonLines count={2} className="h-4" />
            <View className="flex-row items-center justify-between pt-1">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </View>
          </View>
        </View>
      </View>

      <View className="space-y-4 px-5">
        <Skeleton className="h-4 w-24" />
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="bg-paper border border-line rounded-3xl flex-row items-center gap-4 px-4 py-3.5"
          >
            <Skeleton className="w-11 h-12 rounded-2xl" />
            <View className="flex-1 gap-1.5">
              <SkeletonLines count={2} />
              <Skeleton className="h-5 w-16 rounded-full self-start" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}