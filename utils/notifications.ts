import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DAILY_REVIEW_ID_KEY = "notevault-daily-review";

export async function setupNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.DEFAULT,
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
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
      channelId: "default",
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
      sound: true,
      data: {
        noteId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: "default",
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
