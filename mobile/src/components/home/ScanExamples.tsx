import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { CATEGORIES } from "../../constants/categories";
import { useColorScheme } from "nativewind";

type Example = {
  icon: (typeof CATEGORIES)[number]["icon"];
  title: string;
  category: string;
};

const EXAMPLES: Example[] = [
  {
    icon: CATEGORIES[0].icon,
    title: "A bill",
    category: CATEGORIES[0].label,
  },
  {
    icon: CATEGORIES[1].icon,
    title: "A receipt",
    category: CATEGORIES[1].label,
  },
  {
    icon: CATEGORIES[2].icon,
    title: "A form",
    category: CATEGORIES[2].label,
  },
];

function MockPage({ accent }: { accent: string }) {
  return (
    <View className="w-full aspect-[3/4] rounded-2xl bg-cream dark:bg-night border border-line dark:border-line-dark p-2 justify-center gap-2">
      <View className="h-1.5 w-1/2 rounded-full bg-line dark:bg-line-dark" />
      <View className="h-1.5 w-full rounded-full bg-line dark:bg-line-dark" />
      <View
        className="h-1.5 w-4/5 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <View className="h-1.5 w-2/3 rounded-full bg-line dark:bg-line-dark" />
    </View>
  );
}

export default function ScanExamples() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  return (
    <View className="w-full bg-paper dark:bg-paper-dark border border-line dark:border-line-dark rounded-3xl px-4 py-5">
      <Text className="text-[11px] font-body-bold uppercase tracking-wider text-ink-faint dark:text-ink-faint-dark mb-4">
        Examples of what Mochiku can read
      </Text>

      <View className="flex-row gap-3">
        {EXAMPLES.map((e) => {
          const category =
            CATEGORIES.find((c) => c.label === e.category) ?? CATEGORIES[0];
          const accent = dark ? category.darkFg : category.fg;

          return (
            <View key={e.title} className="flex-1 gap-3">
              <MockPage accent={accent} />

              <View className="gap-0.5">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name={e.icon} size={11} color={accent} />
                  <Text className="text-[11px] font-body-bold text-ink dark:text-ink-dark">
                    {e.title}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
