import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import Storage from "expo-sqlite/kv-store";
import { useEffect, useRef, useState } from "react";
import { savePhotoPermanently } from "../services/photos";
import { getUploadMessage, uploadPhoto, warmServer } from "../services/upload";
import { getActiveCooldown, getCooldownMessage } from "../services/cooldown";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AllowAccess } from "../components/AllowAccess";
import Mochiku, { Mood } from "../components/Mochiku";
import { insertItem, saveExtractedData } from "../db/items";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getNotificationPermissionStatus,
  registerForNotificationsAsync,
  syncReminders,
} from "../services/notifications";
import { useThemeColor } from "../theme";

type Status = "idle" | "processing" | "done" | "error";
type ActiveStatus = Exclude<Status, "idle">;
type NotifStatus = "granted" | "denied" | "undetermined";

const ASKED_KEY = "access_asked";

const STATUS_COPY: Record<ActiveStatus, string> = {
  processing: "Reading your photo...",
  done: "Saved to your library",
  error: "Saved to drafts",
};

const STATUS_MOOD: Record<ActiveStatus, Mood> = {
  processing: "thinking",
  done: "happy",
  error: "worried",
};

const SNAP_COOLDOWN_MS = 3000;

const ZOOM_STEPS = [
  { label: "1x", value: 0 },
  { label: "2x", value: 0.15 },
  { label: "3x", value: 0.3 },
];

function Corner({ className }: { className: string }) {
  return <View className={`absolute w-9 h-9 border-brand ${className}`} />;
}

function StatusPopup({
  status,
  message,
}: {
  status: ActiveStatus;
  message: string;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const brand = useThemeColor("brand", "#FF8A4C");
  const calmInk = useThemeColor("calm-ink", "#1F8A6B");
  const soonInk = useThemeColor("soon-ink", "#9A6400");

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const busy = status === "processing";

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,14,19,0.55)",
        opacity,
      }}
    >
      <Animated.View
        style={{ alignItems: "center", gap: 12, transform: [{ scale }] }}
      >
        <Mochiku mood={STATUS_MOOD[status]} height={200} width={140} />

        <View className="flex-row items-center gap-2 bg-paper rounded-3xl px-5 py-3 max-w-[300px]">
          {busy && <ActivityIndicator size="small" color={brand} />}
          {status === "done" && (
            <Ionicons name="checkmark-circle" size={20} color={calmInk} />
          )}
          {status === "error" && (
            <Ionicons name="alert-circle" size={20} color={soonInk} />
          )}
          <Text className="flex-shrink text-ink text-sm font-body-bold text-center">
            {status === "error" && message ? message : STATUS_COPY[status]}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const brandTint = useThemeColor("brand", "#FF8A4C");
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [notifStatus, setNotifStatus] = useState<NotifStatus | null>(null);
  const [asked, setAsked] = useState(
    () => Storage.getItemSync(ASKED_KEY) === "1",
  );
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");
  const [zoom, setZoom] = useState(0);
  const [cooling, setCooling] = useState(false);
  const zoomStart = useRef(0);
  // Captures can overlap, so an older request must not clear a newer capture's
  // popup. Only the most recent request owns the status.
  const latestCapture = useRef(0);

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      zoomStart.current = zoom;
    })
    .onUpdate((e) => {
      const next = zoomStart.current + (e.scale - 1) * 0.5;
      setZoom(Math.min(1, Math.max(0, next)));
    });

  useEffect(() => {
    getNotificationPermissionStatus().then(setNotifStatus);
    // Open the camera already probing, so the host is waking in the background
    // while the user lines up their first photo.
    warmServer();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        getPermission();
        // Same reasoning as mount: resume with the host already waking.
        warmServer();
        getNotificationPermissionStatus().then((s) => {
          setNotifStatus(s);
          if (s === "granted") syncReminders();
        });
      }
    });
    return () => sub.remove();
  }, [getPermission]);

  const handleAllowAll = async () => {
    const cam = await requestPermission();
    await registerForNotificationsAsync();
    const notif = await getNotificationPermissionStatus();
    setNotifStatus(notif);
    if (notif === "granted") syncReminders();
    Storage.setItemSync(ASKED_KEY, "1");
    setAsked(true);
    if (!cam.granted && !cam.canAskAgain) Linking.openSettings();
  };

  if (!permission || notifStatus === null) {
    return (
      <View className="flex-1 bg-black">
        <Stack.Screen options={{ headerShown: false }} />
      </View>
    );
  }

  if (!permission.granted || (!asked && notifStatus !== "granted")) {
    return (
      <View
        className="flex-1 bg-cream"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <AllowAccess onAllow={handleAllowAll} />
      </View>
    );
  }

  const busy = status === "processing";
  // Only the tap-cooldown locks the shutter. A read in flight must not, since
  // every capture is its own draft row and nothing is shared or at risk.
  const locked = cooling;

  const finishCapture = (id: number) => {
    setTimeout(() => {
      setStatus((s) => (id === latestCapture.current ? "idle" : s));
    }, 2500);
  };

  const processPhoto = async (uri: string) => {
    const cooldown = getActiveCooldown();

    const permanentUri = savePhotoPermanently(uri);
    const itemId = await insertItem(permanentUri);
    const captureId = ++latestCapture.current;
    setErrorText("");

    if (cooldown) {
      setErrorText(getCooldownMessage(cooldown.code, cooldown.remaining));
      setStatus("error");
      finishCapture(captureId);
      return;
    }

    setStatus("processing");

    // Fire-and-forget: if the host is asleep this starts waking it while the
    // capture below proceeds. By the time a poller pass runs, it is likely up.
    warmServer();

    try {
      const result = await uploadPhoto(permanentUri);

      if (!result.ok) {
        setErrorText("Couldn't read that photo. Saved to drafts.");
        setStatus("error");
        finishCapture(captureId);
        return;
      }

      await saveExtractedData(itemId, result.extracted);
      await syncReminders();
      setStatus("done");
    } catch (error) {
      const nowCooling = getActiveCooldown();
      setErrorText(
        nowCooling
          ? getCooldownMessage(nowCooling.code, nowCooling.remaining)
          : getUploadMessage(error),
      );
      setStatus("error");
    } finally {
      finishCapture(captureId);
    }
  };

  const snap = async () => {
    if (locked) return;
    setCooling(true);
    setTimeout(() => setCooling(false), SNAP_COOLDOWN_MS);

    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (!photo) return;
    await processPhoto(photo.uri);
  };

  const pickFromGallery = async () => {
    if (locked) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;
    await processPhoto(result.assets[0].uri);
  };

  const flip = () => {
    setZoom(0);
    setFacing(facing === "back" ? "front" : "back");
  };

  return (
    <View className="flex-1 bg-night">
      <Stack.Screen options={{ headerShown: false }} />

      <GestureDetector gesture={pinch}>
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            flash={flash}
            zoom={zoom}
          />
        </View>
      </GestureDetector>

      <View
        pointerEvents="box-none"
        className="absolute inset-0"
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="flex-row items-center justify-between px-5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFlash(flash === "off" ? "on" : "off")}
            className="w-14 h-14 rounded-2xl bg-black/40 border border-white/30 items-center justify-center"
          >
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={20}
              color={flash === "on" ? "#fde047" : "#fff"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/home")}
            className="w-14 h-14 rounded-2xl bg-black/40 border border-white/30 items-center justify-center"
          >
            <Ionicons name="home-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View
          pointerEvents="none"
          className="flex-1 items-center justify-center px-10"
        >
          <View className="w-full aspect-[3/4] max-h-[70%]">
            <Corner className="top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl" />
            <Corner className="top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl" />
            <Corner className="bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl" />
            <Corner className="bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl" />
          </View>

          <View className="mt-5 h-9 justify-center">
            {status === "idle" && (
              <Text className="text-white/80 text-sm font-body-medium">
                Fit the document inside the frame
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row justify-center gap-2 mb-5">
          {ZOOM_STEPS.map((z) => {
            const active = Math.abs(zoom - z.value) < 0.07;
            return (
              <TouchableOpacity
                key={z.label}
                activeOpacity={0.7}
                onPress={() => setZoom(z.value)}
                className={`w-11 h-11 rounded-full items-center justify-center ${
                  active ? "bg-white" : "bg-black/40"
                }`}
              >
                <Text
                  className={`text-sm font-body-bold ${
                    active ? "text-ink" : "text-white"
                  }`}
                >
                  {z.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between px-8">
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={locked}
            onPress={pickFromGallery}
            className="w-14 h-14 rounded-2xl bg-black/40 border border-white/30 items-center justify-center"
          >
            <Ionicons name="images-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={locked}
            onPress={snap}
            className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
          >
            <View
              className={`w-[60px] h-[60px] rounded-full items-center justify-center ${
                locked ? "bg-white/60" : "bg-white"
              }`}
            >
              {busy && <ActivityIndicator color={brandTint} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={flip}
            className="w-14 h-14 rounded-2xl bg-black/40 border border-white/30 items-center justify-center"
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {status !== "idle" && (
          <StatusPopup status={status} message={errorText} />
        )}
      </View>
    </View>
  );
}
