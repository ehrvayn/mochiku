import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import Mochiku from "../components/Mochiku";
import ExpenseMonthRow from "../components/expenses/ExpenseMonthRow";
import ExpenseSummary from "../components/expenses/ExpenseSummary";
import ExpensesEmptyState from "../components/expenses/ExpensesEmptyState";
import ExpensesSkeleton from "../components/expenses/ExpensesSkeleton";
import { getCategory } from "../constants/categories";
import {
  EXPENSES_KEY,
  refreshExpenses,
  type ExpensesData,
} from "../store/appCache";
import { useCacheEntry } from "../store/cache";
import { useThemeColor } from "../theme";
import { Item } from "../types/item";
import { dateKeyFromTimestamp } from "../utils/expenseDate";
import {
  currentMonthKey,
  monthLabel,
  monthOfDateKey,
} from "../utils/month";

const EMPTY_ITEMS: Item[] = [];

type MonthGroupData = {
  key: string;
  label: string;
  totalMinor: number;
  billMinor: number;
  receiptMinor: number;
  count: number;
};

const emptyMonth = (key: string): MonthGroupData => ({
  key,
  label: monthLabel(key),
  totalMinor: 0,
  billMinor: 0,
  receiptMinor: 0,
  count: 0,
});

export default function Expenses() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const brand = useThemeColor("brand", "#FF8A4C");
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");

  const { data, settled } = useCacheEntry<ExpensesData>(EXPENSES_KEY);
  const [refreshing, setRefreshing] = useState(false);

  const items = data?.items ?? EMPTY_ITEMS;
  const missingAmount = data?.missingAmount ?? 0;
  const missingDate = data?.missingDate ?? 0;

  const load = useCallback(() => refreshExpenses(), []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // One pass over the list gives both the current month's breakdown and the
  // past-month rows, so the two can never disagree.
  const groups = useMemo(() => {
    const map = new Map<string, MonthGroupData>();

    for (const item of items) {
      // The document's own date decides the month; the saved date is only a
      // fallback and shows up as a note when it was used.
      const dateKey =
        item.expense_date ?? dateKeyFromTimestamp(item.created_at);
      const key = dateKey ? monthOfDateKey(dateKey) : null;
      if (!key) continue;
      let group = map.get(key);
      if (!group) {
        group = emptyMonth(key);
        map.set(key, group);
      }

      const amount = item.amount_minor ?? 0;
      group.totalMinor += amount;
      group.count += 1;

      const category = getCategory(item.category).label;
      if (category === "Bill") group.billMinor += amount;
      else if (category === "Receipt") group.receiptMinor += amount;
    }

    return Array.from(map.values()).sort((a, b) =>
      b.key.localeCompare(a.key),
    );
  }, [items]);

  const currentKey = currentMonthKey();
  const current =
    groups.find((group) => group.key === currentKey) ?? emptyMonth(currentKey);
  const pastMonths = groups.filter((group) => group.key !== currentKey);

  if (!settled) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ExpensesSkeleton isDark={isDark} />
      </>
    );
  }

  const header = (
    <View
      className={`rounded-b-[50px] px-5 pb-4 ${
        isDark ? "bg-brand-deep" : "bg-brand"
      }`}
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center gap-1 mb-1">
        {items.length !== 0 && (
          <Mochiku mood="idle" height={50} width={50} />
        )}
        <View className={`${items.length === 0 && "pl-5"}`}>
          <Text className="text-3xl font-display text-white">Expenses</Text>
          <Text className="text-xs font-body-medium text-white/80">
            {items.length === 0
              ? missingAmount > 0
                ? "Amounts are still fuzzy"
                : "Nothing counted yet"
              : `${items.length} ${items.length === 1 ? "entry" : "entries"} counted`}
          </Text>
        </View>
      </View>
    </View>
  );

  const missingNote =
    missingAmount > 0 ? (
      <View className="mx-5 mt-3 flex-row items-start gap-2 px-1">
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={inkFaint}
          style={{ marginTop: 1 }}
        />
        <Text className="text-xs font-body text-ink-faint flex-1">
          {missingAmount === 1
            ? "1 bill or receipt has no readable amount yet, so it is not counted."
            : `${missingAmount} bills or receipts have no readable amount yet, so they are not counted.`}
        </Text>
      </View>
    ) : null;

  const dateNote =
    missingDate > 0 ? (
      <View className="mx-5 mt-3 flex-row items-start gap-2 px-1">
        <Ionicons
          name="calendar-outline"
          size={16}
          color={inkFaint}
          style={{ marginTop: 1 }}
        />
        <Text className="text-xs font-body text-ink-faint flex-1">
          {missingDate === 1
            ? "1 entry has no readable date, so it is grouped under the month you added it."
            : `${missingDate} entries have no readable date, so they are grouped under the month you added them.`}
        </Text>
      </View>
    ) : null;

  const notes = (
    <>
      {missingNote}
      {dateNote}
    </>
  );

  const listHeader =
    items.length === 0 ? null : (
      <View>
        <ExpenseSummary
          month={currentKey}
          totalMinor={current.totalMinor}
          billMinor={current.billMinor}
          receiptMinor={current.receiptMinor}
          count={current.count}
          onPress={() =>
            router.push({
              pathname: "/expenses/[month]",
              params: { month: currentKey },
            })
          }
        />

        {notes}

        {pastMonths.length > 0 && (
          <View className="flex-row items-center justify-between px-5 mt-7 mb-3">
            <Text className="text-base font-heading text-ink">Past months</Text>
            <Text className="text-xs font-body-medium text-ink-faint">
              {pastMonths.length}
            </Text>
          </View>
        )}
      </View>
    );

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      {header}

      <FlatList
        data={pastMonths}
        keyExtractor={(month) => month.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand}
            colors={[brand]}
          />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          items.length === 0 ? (
            <ExpensesEmptyState
              mood={missingAmount > 0 ? "confused" : "sleeping"}
              title={
                missingAmount > 0
                  ? "I couldn't read the amounts yet"
                  : undefined
              }
              body={
                missingAmount > 0
                  ? "Open a bill or receipt in Library to check its details, or snap a clearer photo. I'll do the math once the amount is readable."
                  : undefined
              }
            />
          ) : (
            <View className="px-8 pt-10">
              <Text className="text-sm font-body-medium text-ink-faint text-center">
                Past months will appear here as you keep saving bills and
                receipts.
              </Text>
            </View>
          )
        }
        ListFooterComponent={items.length === 0 ? notes : null}
        renderItem={({ item: month }) => (
          <ExpenseMonthRow
            label={month.label}
            totalMinor={month.totalMinor}
            count={month.count}
            onPress={() =>
              router.push({
                pathname: "/expenses/[month]",
                params: { month: month.key },
              })
            }
          />
        )}
      />
    </View>
  );
}
