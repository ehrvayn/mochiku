import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useMemo } from "react";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export type Category = {
  label: string;
  icon: IconName;
  bg: string;
  fg: string;
  darkBg: string;
  darkFg: string;
};

export const CATEGORIES: Category[] = [
  {
    label: "Bill",
    icon: "document-text-outline",
    bg: "#F8E1F0",
    fg: "#9C3A74",
    darkBg: "#3A2434",
    darkFg: "#F0A8D2",
  },
  {
    label: "Receipt",
    icon: "receipt-outline",
    bg: "#DDF5EC",
    fg: "#1F8A6B",
    darkBg: "#1E3A33",
    darkFg: "#86E0C2",
  },
  {
    label: "School",
    icon: "school-outline",
    bg: "#E6E0FA",
    fg: "#5B49B0",
    darkBg: "#2E2A4A",
    darkFg: "#BDB0F5",
  },
  {
    label: "Work",
    icon: "briefcase-outline",
    bg: "#D9ECFA",
    fg: "#1F6FA8",
    darkBg: "#1F3347",
    darkFg: "#8CC8F0",
  },
  {
    label: "Promo",
    icon: "pricetag-outline",
    bg: "#FFF3C4",
    fg: "#8A6A00",
    darkBg: "#3A3320",
    darkFg: "#F0D66E",
  },
  {
    label: "Other",
    icon: "ellipsis-horizontal-circle-outline",
    bg: "#EFEAE0",
    fg: "#6B647A",
    darkBg: "#2F2A33",
    darkFg: "#B8AEC4",
  },
];

export type CategoryColors = { bg: string; fg: string };

const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

export const getCategory = (value: string | null | undefined): Category =>
  CATEGORIES.find((c) => c.label.toLowerCase() === normalize(value)) ??
  CATEGORIES[CATEGORIES.length - 1];

export function useCategoryColors(): Record<string, CategoryColors> {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  return useMemo(() => {
    const result: Record<string, CategoryColors> = {};
    for (const category of CATEGORIES) {
      result[category.label] = dark
        ? { bg: category.darkBg, fg: category.darkFg }
        : { bg: category.bg, fg: category.fg };
    }
    return result;
  }, [dark]);
}
