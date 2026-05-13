import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { Pin, ChevronRight, Bell } from "lucide-react-native";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Note } from "@/types";

interface NoteListItemProps {
  note: Note;
  onPress: () => void;
  onLongPress?: () => void;
  showNotebook?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatReminder(reminderAt?: string | null): {
  label: string;
  isOverdue: boolean;
} | null {
  if (!reminderAt) return null;

  const reminderDate = new Date(reminderAt);

  if (Number.isNaN(reminderDate.getTime())) return null;

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfReminderDay = new Date(
    reminderDate.getFullYear(),
    reminderDate.getMonth(),
    reminderDate.getDate(),
  );

  const dayDiff = Math.round(
    (startOfReminderDay.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const time = reminderDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (reminderDate.getTime() < now.getTime()) {
    return {
      label: `Overdue · ${time}`,
      isOverdue: true,
    };
  }

  if (dayDiff === 0) {
    return {
      label: `Today · ${time}`,
      isOverdue: false,
    };
  }

  if (dayDiff === 1) {
    return {
      label: `Tomorrow · ${time}`,
      isOverdue: false,
    };
  }

  return {
    label: `${reminderDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })} · ${time}`,
    isOverdue: false,
  };
}

function NoteListItem({
  note,
  onPress,
  onLongPress,
  showNotebook,
}: NoteListItemProps) {
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const hideNotePreviews = useSettingsStore((s) => s.hideNotePreviews);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const reminder = formatReminder(note.reminderAt);

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const preview = hideNotePreviews
    ? "Preview hidden"
    : note.plainText.slice(0, 120).replace(/\n/g, " ");

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.container}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`note-item-${note.id}`}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {note.isPinned && (
                <Pin size={14} color={Colors.accent} style={styles.pinIcon} />
              )}

              {note.reminderAt && (
                <Bell
                  size={14}
                  color={reminder?.isOverdue ? Colors.danger : Colors.success}
                  style={styles.pinIcon}
                />
              )}

              <Text style={styles.title} numberOfLines={1}>
                {note.title}
              </Text>
            </View>

            <ChevronRight size={16} color={Colors.textMuted} />
          </View>

          {preview.length > 0 && (
            <Text
              style={[styles.preview, hideNotePreviews && styles.previewHidden]}
              numberOfLines={2}
            >
              {preview}
            </Text>
          )}

          {reminder && (
            <View
              style={[
                styles.reminderPill,
                reminder.isOverdue && styles.reminderPillOverdue,
              ]}
            >
              <Bell
                size={12}
                color={reminder.isOverdue ? Colors.danger : Colors.success}
              />

              <Text
                style={[
                  styles.reminderText,
                  reminder.isOverdue && styles.reminderTextOverdue,
                ]}
                numberOfLines={1}
              >
                {reminder.label}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>

            {showNotebook && (
              <Text style={styles.notebook}>{showNotebook}</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(NoteListItem);

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors.card,
      borderRadius: 14,
      marginBottom: 10,
      padding: 16,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
    },
    content: {
      gap: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 8,
    },
    pinIcon: {
      marginRight: 6,
    },
    title: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: Colors.text,
      flex: 1,
    },
    preview: {
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 18,
    },
    previewHidden: {
      fontStyle: "italic" as const,
      opacity: 0.7,
    },
    reminderPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(52,211,153,0.12)",
      borderWidth: 0.5,
      borderColor: "rgba(52,211,153,0.3)",
    },
    reminderPillOverdue: {
      backgroundColor: "rgba(255,77,106,0.12)",
      borderColor: "rgba(255,77,106,0.3)",
    },
    reminderText: {
      color: Colors.success,
      fontSize: 11,
      fontWeight: "700" as const,
    },
    reminderTextOverdue: {
      color: Colors.danger,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    date: {
      fontSize: 11,
      color: Colors.textMuted,
    },
    notebook: {
      fontSize: 11,
      color: Colors.accent,
      fontWeight: "500" as const,
    },
  });
