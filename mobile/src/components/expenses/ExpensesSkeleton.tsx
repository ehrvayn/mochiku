import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Skeleton, {
  SkeletonCircle,
  SkeletonLines,
} from "../ui/Skeleton";

export default function ExpensesSkeleton({ isDark }: { isDark: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <View
        className={`rounded-b-[50px] px-5 pb-4 ${
          isDark ? "bg-brand-deep" : "bg-brand"
        }`}
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center gap-1" style={{ height: 50 }}>
          <SkeletonCircle size={50} />
          <View className="flex-1 gap-1 pl-2">
            <Skeleton className="h-7 w-32 rounded-xl" />
            <Skeleton className="h-3 w-40 rounded-full" />
          </View>
        </View>
      </View>

      <View className="mx-5 mt-4 bg-paper border border-line rounded-3xl p-5 gap-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-3 w-32 rounded-full" />
      </View>

      <View className="mx-5 mt-3 bg-paper border border-line rounded-3xl p-5 gap-4">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <SkeletonLines count={2} className="h-3.5" />
      </View>

      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 mx-5 mt-3 rounded-2xl" />
      ))}
    </View>
  );
}
