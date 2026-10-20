import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { softShadow } from "../../../constants/tones";
import { getItemById, getItemFields } from "../../../db/items";
import {
  exportPreparedItem,
  prepareItemExport,
  type PreparedItemExport,
} from "../../../services/share";
import { useThemeColor } from "../../../theme";
import type { ItemField } from "../../../types/item";

function loadWebView() {
  try {
    if (!UIManager.hasViewManagerConfig("RNCWebView")) return null;
    return require("react-native-webview")
      .WebView as typeof import("react-native-webview").WebView;
  } catch {
    return null;
  }
}

const WebView = loadWebView();

export default function ItemPreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const cream = useThemeColor("cream", "#FFF8EC");
  const ink = useThemeColor("ink", "#2B2438");
  const [prepared, setPrepared] = useState<PreparedItemExport | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: () => getItemById(id),
    enabled: !!id,
  });

  const { data: fields, isLoading: fieldsLoading } = useQuery<ItemField[]>({
    queryKey: ["itemFields", id],
    queryFn: () => getItemFields(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!item || fields === undefined) return;

    let active = true;
    setPrepared(null);
    setPrepareError(null);

    prepareItemExport(item, fields)
      .then((next) => {
        if (active) setPrepared(next);
      })
      .catch((error) => {
        if (active) {
          setPrepareError(
            error instanceof Error ? error.message : "Please try again.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [item, fields]);

  const screenOptions = {
    title: "PDF Preview",
    headerStyle: { backgroundColor: cream },
    headerShadowVisible: false,
    headerTintColor: ink,
    headerTitleStyle: { fontFamily: "Nunito_800ExtraBold" },
  };

  if (itemLoading || fieldsLoading) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <View className="flex-1 items-center justify-center bg-cream">
          <ActivityIndicator color={ink} />
          <Text className="mt-3 text-ink-faint font-body-medium">
            Loading item...
          </Text>
        </View>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <View className="flex-1 items-center justify-center bg-cream">
          <Text className="text-ink-soft font-body-medium">
            Item not found.
          </Text>
        </View>
      </>
    );
  }

  const handleExport = async () => {
    if (!prepared || isExporting) return;
    setIsExporting(true);
    try {
      await exportPreparedItem(prepared);
    } catch (error) {
      Alert.alert(
        "Couldn't export",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={screenOptions} />

      {prepared && WebView ? (
        <WebView
          originWhitelist={["*"]}
          source={{ html: prepared.html }}
          style={{ flex: 1, backgroundColor: "#E9E4DA"}}
          javaScriptEnabled={false}
          setSupportMultipleWindows={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-cream px-6">
          {!WebView ? (
            <>
              <Ionicons name="construct-outline" size={32} color={ink} />
              <Text className="mt-3 text-center text-ink-soft font-body-medium">
                PDF preview needs a rebuilt app.
              </Text>
              <Text className="mt-1 text-center text-xs text-ink-faint">
                Run npx expo run:android or run:ios, then reopen this screen.
              </Text>
            </>
          ) : prepareError ? (
            <>
              <Ionicons name="alert-circle-outline" size={32} color={ink} />
              <Text className="mt-3 text-center text-ink-soft font-body-medium">
                Couldn't build the PDF preview.
              </Text>
              <Text className="mt-1 text-center text-xs text-ink-faint">
                {prepareError}
              </Text>
            </>
          ) : (
            <>
              <ActivityIndicator color={ink} />
              <Text className="mt-3 text-ink-faint font-body-medium">
                Building PDF preview...
              </Text>
            </>
          )}
        </View>
      )}

      <View
        className="border-t border-line bg-cream px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!prepared || isExporting}
          onPress={handleExport}
          className="w-full bg-brand py-4 rounded-full flex-row items-center justify-center gap-2"
          style={[softShadow, !prepared ? { opacity: 0.5 } : null]}
        >
          {isExporting ? (
            <ActivityIndicator color="#FFF8EC" />
          ) : (
            <>
              <Ionicons name="share-outline" size={18} color="#FFF8EC" />
              <Text className="text-white font-heading text-base">
                Export PDF
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
