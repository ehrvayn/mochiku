import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { softShadow } from "../constants/tones";
import { useThemeColor } from "../theme";
import { useColorScheme } from "nativewind";


const VISIBLE_ON = ["/home", "/library", "/profile", "/settings"];

function NavItem({
  active,
  activeIcon,
  idleIcon,
  onPress,
  activeColor,
  idleColor,
}: {
  active: boolean;
  activeIcon: keyof typeof Ionicons.glyphMap;
  idleIcon: keyof typeof Ionicons.glyphMap;
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
      <Ionicons
        name={active ? activeIcon : idleIcon}
        size={22}
        color={active ? activeColor : idleColor}
      />
    </TouchableOpacity>
  );
}

export default function FloatingNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const brandInk = useThemeColor("brand-ink", "#C2531A");
  const cream = useThemeColor("cream", "#FFF8EC");
  const { colorScheme } = useColorScheme();

  const navActive = "white";
  const navIdle = colorScheme === "dark" ? "rgba(245, 235, 222, 0.55)" : "rgba(255, 248, 236, 0.55)";

  if (!VISIBLE_ON.includes(pathname)) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ bottom: insets.bottom + 12, height: 88 }}
      className="absolute left-5 right-5"
    >
      <View className={`absolute bottom-0 left-2 right-2 h-16 rounded-full border border-brand-deep/20 ${colorScheme === "dark" ? "bg-brand-deep" : "bg-brand"}`} />

      <View
        pointerEvents="box-none"
        className="absolute inset-0 flex-row items-end justify-between px-8"
      >
        <View className="flex-row items-end gap-3">
          <NavItem
            active={pathname === "/home"}
            activeIcon="home"
            idleIcon="home"
            activeColor={navActive}
            idleColor={navIdle}
            onPress={() => pathname !== "/home" && router.navigate("/home")}
          />
          <NavItem
            active={pathname === "/library"}
            activeIcon="albums"
            idleIcon="albums"
            activeColor={navActive}
            idleColor={navIdle}
            onPress={() =>
              pathname !== "/library" && router.navigate("/library")
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
            active={pathname === "/profile"}
            activeIcon="person"
            idleIcon="person"
            activeColor={navActive}
            idleColor={navIdle}
            onPress={() =>
              pathname !== "/profile" && router.navigate("/profile")
            }
          />
          <NavItem
            active={pathname === "/settings"}
            activeIcon="settings"
            idleIcon="settings"
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
