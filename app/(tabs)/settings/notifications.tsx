import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Clock, ShieldAlert } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  scheduleDailyReviewNotification,
  cancelDailyReviewNotification,
} from "@/utils/notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const noteReminders = useSettingsStore((s) => s.noteReminders);
  const setNoteReminders = useSettingsStore((s) => s.setNoteReminders);

  const dailyReview = useSettingsStore((s) => s.dailyReview);
  const setDailyReview = useSettingsStore((s) => s.setDailyReview);

  const securityAlerts = useSettingsStore((s) => s.securityAlerts);
  const setSecurityAlerts = useSettingsStore((s) => s.setSecurityAlerts);

  const handleDailyReviewToggle = useCallback(
    async (value: boolean) => {
      if (!value) {
        await cancelDailyReviewNotification();
        setDailyReview(false);
        return;
      }

      const scheduled = await scheduleDailyReviewNotification();

      if (!scheduled) {
        Alert.alert(
          "Notifications disabled",
          "Please allow notifications in your device settings to use daily review reminders.",
        );
        setDailyReview(false);
        return;
      }

      setDailyReview(true);

      Alert.alert(
        "Daily review enabled",
        "NoteVault will remind you every day at 7:00 PM.",
      );
    },
    [setDailyReview],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>

        <Text style={styles.title}>Notifications</Text>

        <Text style={styles.subtitle}>
          Control how NoteVault keeps you updated.
        </Text>

        <SettingToggle
          Colors={Colors}
          icon={<Bell size={22} color={Colors.accent} />}
          title="Note reminders"
          subtitle="Receive reminders linked to your notes"
          value={noteReminders}
          onValueChange={setNoteReminders}
        />

        <SettingToggle
          Colors={Colors}
          icon={<Clock size={22} color={Colors.accent} />}
          title="Daily review"
          subtitle="Get a daily prompt to review recent notes"
          value={dailyReview}
          onValueChange={handleDailyReviewToggle}
        />

        <SettingToggle
          Colors={Colors}
          icon={<ShieldAlert size={22} color={Colors.accent} />}
          title="Security alerts"
          subtitle="Notify me about important account activity"
          value={securityAlerts}
          onValueChange={setSecurityAlerts}
        />
      </ScrollView>
    </View>
  );
}

function SettingToggle({
  Colors,
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  Colors: any;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const styles = makeStyles(Colors);

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>{icon}</View>

        <View style={styles.textBlock}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: Colors.surface,
          true: Colors.accentSoft,
        }}
        thumbColor={value ? Colors.accent : Colors.textMuted}
      />
    </View>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 40,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    backText: {
      color: Colors.textSecondary,
      fontSize: 16,
      marginLeft: 4,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: Colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: Colors.textSecondary,
      marginBottom: 24,
    },
    row: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 12,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.accentSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    textBlock: {
      flex: 1,
    },
    rowTitle: {
      color: Colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    rowSubtitle: {
      color: Colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },
  });
