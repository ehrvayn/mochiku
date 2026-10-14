import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getRemindableItems } from "../db/items";
import { ensureLocalUser } from "../db/user";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null = null;
let syncing: Promise<void> = Promise.resolve();

export function getNotifications(): NotificationsModule | null {
  if (isExpoGo && Platform.OS === "android") return null;
  if (!cached) {
    cached = require("expo-notifications") as NotificationsModule;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
  return cached;
}

export async function registerForNotificationsAsync(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) {
    console.log("Notifications are unavailable in Expo Go on Android");
    return false;
  }

  if (!Device.isDevice) {
    console.log("Must use a physical device for notifications");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission denied");
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return true;
}

/** Fallback local time-of-day when the user hasn't set one. */
const DEFAULT_REMINDER_TIME = { hour: 9, minute: 0 };

/** Parses a "HH:MM" string into hours/minutes, falling back to the default. */
function parseReminderTime(value: string | null | undefined) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!match) return DEFAULT_REMINDER_TIME;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return DEFAULT_REMINDER_TIME;
  return { hour, minute };
}

export function syncReminders(): Promise<void> {
  syncing = syncing.then(runSync).catch((err) => {
    console.log("syncReminders failed:", err);
  });
  return syncing;
}

async function runSync() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const items = await getRemindableItems();
  const now = new Date();

  const user = await ensureLocalUser();
  const { hour, minute } = parseReminderTime(user?.reminder_time);

  const REMINDERS = [
    { suffix: "eve", daysBefore: 1, title: "Due tomorrow" },
    { suffix: "day", daysBefore: 0, title: "Due today" },
  ];

  for (const item of items) {
    for (const r of REMINDERS) {
      const when = new Date(item.deadline_at!);
      when.setDate(when.getDate() - r.daysBefore);
      when.setHours(hour, minute, 0, 0);
      if (when <= now) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `${item.id}:${r.suffix}`,
        content: {
          title: r.title,
          body: item.title ?? "You have a deadline coming up",
          data: { itemId: item.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: "default",
        },
      });
    }
  }
}

export async function getNotificationPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  const Notifications = getNotifications();
  if (!Notifications) return "denied";
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

