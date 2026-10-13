import { View, useWindowDimensions } from "react-native";
import Skeleton, { SkeletonCircle, SkeletonLines } from "../ui/Skeleton";

/**
 * Library skeleton. The cards use the same 3:4 image ratio and the same
 * two-column grid maths as the real PhotoCard, so the swap does not reflow.
 */
export default function LibrarySkeleton({
  isDark,
  showHeader = true,
}: {
  isDark: boolean;
  showHeader?: boolean;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      {showHeader && (
        <View
          className={`rounded-b-[50px] px-5 pb-4 ${
            isDark ? "bg-brand-deep" : "bg-brand"
          }`}
        >
          <View className="flex-row items-center gap-1" style={{ height: 50 }}>
            <SkeletonCircle size={50} />
            <View className="flex-1 gap-1 pl-2">
              <Skeleton className="h-7 w-32 rounded-xl" />
              <Skeleton className="h-3 w-40 rounded-full" />
            </View>
          </View>
          <View className="mt-3">
            <Skeleton className="h-11 w-full rounded-full" />
          </View>
        </View>
      )}

      {/* Category chips row */}
      <View className="mt-4 pb-4 flex-row gap-2 px-5">
        {["All", "Receipt", "Bill", "Work"].map((_, i) => (
          <Skeleton
            key={i}
            className="h-9 rounded-full"
            style={{ width: i === 0 ? 72 : 96 }}
          />
        ))}
      </View>

      {/* Two-column card grid, mirroring the real FlatList row layout */}
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {[0, 1].map((row) => (
          <View key={row} className="flex-row" style={{ gap: 12 }}>
            {[0, 1].map((col) => (
              <View key={col} style={{ width: cardWidth }}>
                <View className="bg-paper border border-line rounded-3xl overflow-hidden">
                  <Skeleton
                    className="rounded-none w-full"
                    style={{ aspectRatio: 3 / 4 }}
                  />
                  <View className="p-3 gap-1.5">
                    <SkeletonLines count={2} className="h-3.5" />
                    <Skeleton className="h-5 w-24 rounded-full self-start" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}