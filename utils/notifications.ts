import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DAILY_REVIEW_ID_KEY = "notevault-daily-review";
const DEFAULT_CHANNEL_ID = "default";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4F7CFF",
  });
}

export async function requestNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted;
}

export async function scheduleDailyReviewNotification() {
  await setupNotificationChannel();

  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return false;
  }

  await cancelDailyReviewNotification();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REVIEW_ID_KEY,
    content: {
      title: "Daily review",
      body: "Take a quick moment to review your recent notes.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
      channelId: DEFAULT_CHANNEL_ID,
    },
  });

  return true;
}

export async function cancelDailyReviewNotification() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REVIEW_ID_KEY);
}

export async function scheduleNoteReminderNotification({
  noteId,
  title,
  reminderAt,
}: {
  noteId: string;
  title: string;
  reminderAt: string;
}) {
  await setupNotificationChannel();

  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return null;
  }

  const triggerDate = new Date(reminderAt);

  if (Number.isNaN(triggerDate.getTime())) {
    return null;
  }

  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Note reminder",
      body: title?.trim() ? title : "You have a note reminder.",
      sound: "default",
      data: {
        noteId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: DEFAULT_CHANNEL_ID,
    },
  });

  return notificationId;
}

export async function cancelNoteReminderNotification(
  notificationId?: string | null,
) {
  if (!notificationId) return;

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
