import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, BellRing } from "lucide-react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import { useNotes } from "@/providers/NotesProvider";
import { Note } from "@/types";

type ReminderItem = Note & {
  reminderDate: Date;
  isOverdue: boolean;
};

function formatReminder(date: Date) {
  const now = new Date();

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startReminder = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.round(
    (startReminder.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.getTime() < now.getTime()) {
    return `Overdue · ${time}`;
  }

  if (diffDays === 0) {
    return `Today · ${time}`;
  }

  if (diffDays === 1) {
    return `Tomorrow · ${time}`;
  }

  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} · ${time}`;
}

export default function RemindersScreen() {
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const { notes } = useNotes();

  const reminders = useMemo<ReminderItem[]>(() => {
    return notes
      .filter((note) => note.reminderAt)
      .map((note) => {
        const reminderDate = new Date(note.reminderAt!);

        return {
          ...note,
          reminderDate,
          isOverdue: reminderDate.getTime() < Date.now(),
        };
      })
      .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
  }, [notes]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.text} />
        </Pressable>

        <Text style={styles.title}>Upcoming Reminders</Text>
      </View>

      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Bell size={30} color={Colors.textMuted} />
          </View>

          <Text style={styles.emptyTitle}>No reminders yet</Text>

          <Text style={styles.emptySubtitle}>
            Add reminders to your notes and they’ll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/note-editor",
                  params: { noteId: item.id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    item.isOverdue && styles.iconCircleOverdue,
                  ]}
                >
                  <BellRing
                    size={16}
                    color={item.isOverdue ? Colors.danger : Colors.accent}
                  />
                </View>

                <View style={styles.cardText}>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {item.title || "Untitled"}
                  </Text>

                  <Text
                    style={[
                      styles.reminderText,
                      item.isOverdue && styles.reminderTextOverdue,
                    ]}
                  >
                    {formatReminder(item.reminderDate)}
                  </Text>
                </View>
              </View>

              {item.plainText?.length > 0 && (
                <Text style={styles.preview} numberOfLines={2}>
                  {item.plainText}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 20,
    },

    backButton: {
      marginRight: 12,
    },

    title: {
      color: Colors.text,
      fontSize: 28,
      fontWeight: "800",
    },

    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },

    card: {
      backgroundColor: Colors.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
      marginBottom: 12,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.accentSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },

    iconCircleOverdue: {
      backgroundColor: "rgba(255,77,106,0.12)",
    },

    cardText: {
      flex: 1,
    },

    noteTitle: {
      color: Colors.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },

    reminderText: {
      color: Colors.accent,
      fontSize: 13,
      fontWeight: "600",
    },

    reminderTextOverdue: {
      color: Colors.danger,
    },

    preview: {
      marginTop: 12,
      color: Colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },

    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: Colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },

    emptyTitle: {
      color: Colors.text,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
    },

    emptySubtitle: {
      color: Colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
    },
  });
