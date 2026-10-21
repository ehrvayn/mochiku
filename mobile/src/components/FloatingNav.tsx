import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { softShadow } from "../constants/tones";
import { useThemeColor } from "../theme";
import { useColorScheme } from "nativewind";

const VISIBLE_ON = ["/schedule", "/library", "/expenses", "/settings"];

type NavGlyph =
  | { family: "ionicons"; name: keyof typeof Ionicons.glyphMap }
  | { family: "material"; name: keyof typeof MaterialCommunityIcons.glyphMap };

const ion = (name: keyof typeof Ionicons.glyphMap): NavGlyph => ({
  family: "ionicons",
  name,
});

// Ionicons has no peso glyph; MaterialCommunityIcons carries `currency-php`,
// which matches the Expenses tab better than a generic wallet.
const PESO: NavGlyph = { family: "material", name: "currency-php" };

function NavIcon({ glyph, color }: { glyph: NavGlyph; color: string }) {
  if (glyph.family === "material") {
    return <MaterialCommunityIcons name={glyph.name} size={22} color={color} />;
  }
  return <Ionicons name={glyph.name} size={22} color={color} />;
}

function NavItem({
  active,
  icon,
  onPress,
  activeColor,
  idleColor,
}: {
  active: boolean;
  icon: NavGlyph;
  onPress: () => void;
  activeColor: string;
  idleColor: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className={`w-12 h-11 mb-2 rounded-full items-center justify-center ${
        active ? "bg-cream/20" : ""
      }`}
    >
      <NavIcon glyph={icon} color={active ? activeColor : idleColor} />
    </TouchableOpacity>
  );
}

export default function FloatingNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const { colorScheme } = useColorScheme();

  const navActive = "white";
  const navIdle =
    colorScheme === "dark"
      ? "rgba(245, 235, 222, 0.55)"
      : "rgba(255, 248, 236, 0.55)";

  if (!VISIBLE_ON.includes(pathname)) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ bottom: insets.bottom + 12, height: 88 }}
      className="absolute left-5 right-5"
    >
      <View
        className={`absolute bottom-0 left-2 right-2 h-16 rounded-full border border-brand-deep/20 ${colorScheme === "dark" ? "bg-brand-deep" : "bg-brand"}`}
      />

      <View
        pointerEvents="box-none"
        className="absolute inset-0 flex-row items-end justify-between px-8"
      >
        <View className="flex-row items-end gap-3">
          <NavItem
            active={pathname === "/library"}
            icon={ion("albums")}
            activeColor={navActive}
            idleColor={navIdle}
            onPress={() =>
              pathname !== "/library" && router.navigate("/library")
            }
          />
          <NavItem
            active={pathname === "/schedule"}
            icon={ion("calendar")}
            activeColor={navActive}
            idleColor={navIdle}
            onPress={() =>
              pathname !== "/schedule" && router.navigate("/schedule")
            }
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.navigate("/")}
          className={`w-[72px] h-[72px] mb-3 rounded-full bg-cream items-center justify-center border-4  ${colorScheme === "dark" ? "border-brand/40" : "border-brand"}`}
          style={softShadow}
        >
          <Ionicons name="camera" size={30} color={brandInk} />
        </TouchableOpacity>

        <View className="flex-row items-end gap-3">
          <NavItem
            active={pathname === "/expenses"}
            icon={PESO}
            activeColor={navActive}
            idleColor={navIdle}
            onPress={() =>
              pathname !== "/expenses" && router.navigate("/expenses")
            }
          />
          <NavItem
            active={pathname === "/settings"}
            icon={ion("settings")}
            activeColor={navActive}
            idleColor={navIdle}
            onPress={() =>
              pathname !== "/settings" && router.navigate("/settings")
            }
          />
        </View>
      </View>
    </View>
  );
}
