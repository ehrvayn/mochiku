import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import LibraryItemRow from "../../components/LibraryItemRow";
import ExpensesEmptyState from "../../components/expenses/ExpensesEmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { getExpenseItemsByMonth } from "../../db/expenses";
import { Item } from "../../types/item";
import { dateKeyFromTimestamp } from "../../utils/expenseDate";
import { formatPeso } from "../../utils/money";
import {
  currentMonthKey,
  monthLabel,
  shortDateLabelFromKey,
} from "../../utils/month";

const EMPTY_ITEMS: Item[] = [];

export default function ExpenseMonth() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { month: rawMonth } = useLocalSearchParams<{ month: string }>();
  // Internal links always pass YYYY-MM, but a hand-edited deep link should not
  // leave the screen showing one label with another month's items.
  const month =
    rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)
      ? rawMonth
      : currentMonthKey();

  const {
    data: items = EMPTY_ITEMS,
    isLoading,
    refetch,
  } = useQuery<Item[]>({
    queryKey: ["expenseMonth", month],
    queryFn: () => getExpenseItemsByMonth(month),
    enabled: Boolean(month),
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const totalMinor = useMemo(
    () => items.reduce((sum, item) => sum + (item.amount_minor ?? 0), 0),
    [items],
  );

  const header = (
    <View
      className={`rounded-b-[50px] px-5 pb-5 ${
        isDark ? "bg-brand-deep" : "bg-brand"
      }`}
      style={{ paddingTop: insets.top + 14 }}
    >
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/expenses")
          }
          className="w-10 h-10 rounded-full bg-cream/20 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-2xl font-display text-white">
            {monthLabel(month)}
          </Text>
          <Text className="text-xs font-body-medium text-white/80">
            {isLoading
              ? "Adding it up…"
              : `${items.length} ${items.length === 1 ? "item" : "items"} · ${formatPeso(totalMinor)}`}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      {header}

      {isLoading ? (
        <View className="px-5 pt-5 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-3xl" />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 40,
          }}
          ListEmptyComponent={
            <ExpensesEmptyState
              compact
              mood="idle"
              title={`Nothing in ${monthLabel(month)}`}
              body="No bills or receipts with a readable amount landed in this month."
            />
          }
          renderItem={({ item }) => (
            <LibraryItemRow
              item={item}
              amountLabel={formatPeso(item.amount_minor ?? 0)}
              metaLabel={shortDateLabelFromKey(
                item.expense_date ??
                  dateKeyFromTimestamp(item.created_at) ??
                  "",
              )}
              onPress={() =>
                router.push({
                  pathname: "/item/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}
