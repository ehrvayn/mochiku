import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { getCategory, useCategoryColors } from "../../constants/categories";
import type { IconName } from "../../constants/categories";
import { softShadow } from "../../constants/tones";
import { useThemeColor } from "../../theme";
import { formatPeso } from "../../utils/money";
import { monthLabel } from "../../utils/month";

type Props = {
  month: string;
  totalMinor: number;
  billMinor: number;
  receiptMinor: number;
  count: number;
  onPress?: () => void;
};

export default function ExpenseSummary({
  month,
  totalMinor,
  billMinor,
  receiptMinor,
  count,
  onPress,
}: Props) {
  const categoryColors = useCategoryColors();
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const bill = getCategory("bill");
  const receipt = getCategory("receipt");
  const billColors = categoryColors[bill.label];
  const receiptColors = categoryColors[receipt.label];

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        className="mx-5 mt-4 bg-paper border border-line rounded-3xl p-5"
        style={softShadow}
        accessible
        accessibilityLabel={`${monthLabel(month)} total, ${formatPeso(totalMinor)}${
          onPress ? ". Tap to view items." : ""
        }`}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-body-bold text-brand-ink">
            This month
          </Text>
          <Text className="text-xs font-body-medium text-ink-faint">
            {monthLabel(month)}
          </Text>
        </View>

        <Text
          className="text-4xl font-display text-ink mt-2"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatPeso(totalMinor)}
        </Text>

        <Text className="text-xs font-body-medium text-ink-faint mt-1">
          {count === 0
            ? "No bills or receipts this month yet"
            : `${count} ${count === 1 ? "bill or receipt" : "bills and receipts"}`}
        </Text>

        {onPress && (
          <View className="flex-row items-center gap-1 mt-3">
            <Text
              className="text-xs font-body-bold"
              style={{ color: brandInk }}
            >
              View items
            </Text>
            <Ionicons name="chevron-forward" size={12} color={brandInk} />
          </View>
        )}
      </TouchableOpacity>

      {totalMinor > 0 && (
        <View className="mx-5 mt-3 bg-paper border border-line rounded-3xl p-5">
          <Text className="text-base font-heading text-ink mb-3">
            By category
          </Text>

          <View className="flex-row h-3 rounded-full overflow-hidden bg-cream">
            {billMinor > 0 && (
              <View
                style={{ flex: billMinor, backgroundColor: billColors.fg }}
              />
            )}
            {receiptMinor > 0 && (
              <View
                style={{
                  flex: receiptMinor,
                  backgroundColor: receiptColors.fg,
                }}
              />
            )}
          </View>

          <View className="gap-3 mt-4">
            <BreakdownRow
              icon={bill.icon}
              label={bill.label}
              amountMinor={billMinor}
              totalMinor={totalMinor}
              bg={billColors.bg}
              fg={billColors.fg}
            />
            <BreakdownRow
              icon={receipt.icon}
              label={receipt.label}
              amountMinor={receiptMinor}
              totalMinor={totalMinor}
              bg={receiptColors.bg}
              fg={receiptColors.fg}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function BreakdownRow({
  icon,
  label,
  amountMinor,
  totalMinor,
  bg,
  fg,
}: {
  icon: IconName;
  label: string;
  amountMinor: number;
  totalMinor: number;
  bg: string;
  fg: string;
}) {
  const percent =
    totalMinor > 0 ? Math.round((amountMinor / totalMinor) * 100) : 0;

  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <View
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ backgroundColor: bg }}
        >
          <Ionicons name={icon} size={14} color={fg} />
        </View>
        <Text className="text-sm font-body-medium text-ink">{label}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-body-medium text-ink-faint">
          {percent}%
        </Text>
        <Text className="text-sm font-body-bold text-ink">
          {formatPeso(amountMinor)}
        </Text>
      </View>
    </View>
  );
}
