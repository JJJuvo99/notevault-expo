import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ArrowLeft, Plus, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useNotes, useNotebookById } from "@/providers/NotesProvider";
import NoteListItem from "@/components/NoteListItem";
import { Note } from "@/types";

export default function NotebookDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const notebook = useNotebookById(id ?? "");
  const { getNotebookNotes, deleteNote, togglePin } = useNotes();

  const notebookNotes = useMemo(
    () => getNotebookNotes(id ?? ""),
    [getNotebookNotes, id],
  );

  console.log(
    "[NotebookDetail] Rendering notebook:",
    notebook?.name,
    "with",
    notebookNotes.length,
    "notes",
  );

  const handleNotePress = useCallback(
    (noteId: string) => {
      console.log("[NotebookDetail] Opening note:", noteId);
      router.push({
        pathname: "/note-editor",
        params: { noteId, notebookId: id },
      });
    },
    [router, id],
  );

  const handleNoteLongPress = useCallback(
    (note: Note) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log("[NotebookDetail] Long press on note:", note.title);
      Alert.alert(note.title, "Choose an action", [
        { text: "Cancel", style: "cancel" },
        {
          text: note.isPinned ? "Unpin" : "Pin to Top",
          onPress: () => {
            console.log("[NotebookDetail] Toggling pin for:", note.title);
            void togglePin(note.id);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Delete Note?", "This action cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  console.log("[NotebookDetail] Deleting note:", note.title);
                  void deleteNote(note.id);
                },
              },
            ]);
          },
        },
      ]);
    },
    [deleteNote, togglePin],
  );

  const handleNewNote = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("[NotebookDetail] Creating new note in notebook:", id);
    router.push({ pathname: "/note-editor", params: { notebookId: id } });
  }, [router, id]);

  const handleAIChat = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("[NotebookDetail] Opening AI chat for notebook:", id);
    router.push({ pathname: "/ai-chat", params: { notebookId: id } });
  }, [router, id]);

  const renderNote = useCallback(
    ({ item }: { item: Note }) => (
      <NoteListItem
        note={item}
        onPress={() => handleNotePress(item.id)}
        onLongPress={() => handleNoteLongPress(item)}
      />
    ),
    [handleNotePress, handleNoteLongPress],
  );

  const keyExtractor = useCallback((item: Note) => item.id, []);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer} testID="notebook-empty">
        <Text style={styles.emptyTitle}>No notes yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button below to create your first note in this notebook
        </Text>
      </View>
    ),
    [styles.emptyContainer, styles.emptyTitle, styles.emptySubtitle],
  );

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      testID="notebook-detail-screen"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="btn-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {notebook?.name ?? "Notebook"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {notebookNotes.length}{" "}
            {notebookNotes.length === 1 ? "note" : "notes"}
          </Text>
        </View>
        <Pressable onPress={handleAIChat} style={styles.aiBtn} testID="btn-ai">
          <Sparkles size={20} color={Colors.accent} />
        </Pressable>
      </View>

      <FlatList
        data={notebookNotes}
        renderItem={renderNote}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />

      <Pressable
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={handleNewNote}
        testID="btn-new-note"
      >
        <Plus size={24} color="#fff" />
      </Pressable>
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
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.card,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
    },
    headerCenter: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: Colors.text,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 13,
      color: Colors.textSecondary,
      marginTop: 1,
    },
    aiBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.accentSoft,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 100,
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: Colors.textMuted,
      textAlign: "center",
      paddingHorizontal: 40,
      lineHeight: 20,
    },
    fab: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.accent,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: Colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  });
