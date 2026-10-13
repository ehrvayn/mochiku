import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "../../theme";

export type LibraryTab = "saved" | "drafts";

const TABS: { key: LibraryTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "saved", label: "Saved", icon: "albums-outline" },
  { key: "drafts", label: "Drafts", icon: "hourglass-outline" },
];

export default function LibrarySubnav({
  tab,
  onChange,
  draftCount,
}: {
  tab: LibraryTab;
  onChange: (tab: LibraryTab) => void;
  draftCount: number;
}) {
  const ink = useThemeColor("ink", "#2B2438");
  const inkFaint = useThemeColor("ink-faint", "#A39DB0");
  const line = useThemeColor("line", "#F0E4CF");
  const paper = useThemeColor("paper", "#FFFFFF");
  const brandInk = useThemeColor("brand-ink", "#C2531A");

  return (
    <View
      className="flex-row items-center rounded-full border p-1 gap-1"
      style={{ backgroundColor: paper, borderColor: line }}
    >
      {TABS.map(({ key, label, icon }) => {
        const active = tab === key;
        const count = key === "drafts" ? draftCount : 0;
        return (
          <TouchableOpacity
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            activeOpacity={0.7}
            onPress={() => onChange(key)}
            className="flex-row items-center justify-center gap-1.5 flex-1 h-9 rounded-full"
            style={active ? { backgroundColor: brandInk } : undefined}
          >
            <Ionicons
              name={icon}
              size={14}
              color={active ? paper : inkFaint}
            />
            <Text
              className="text-sm font-body-bold"
              style={{ color: active ? paper : ink }}
            >
              {label}
            </Text>
            {count > 0 && (
              <View
                className="min-w-[18px] h-[18px] px-1 rounded-full items-center justify-center"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.25)" : line,
                }}
              >
                <Text
                  className="text-[10px] font-body-bold"
                  style={{ color: active ? paper : inkFaint }}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}