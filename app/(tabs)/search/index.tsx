import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search as SearchIcon, X } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useNotes } from "@/providers/NotesProvider";
import NoteListItem from "@/components/NoteListItem";
import { Note } from "@/types";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const { searchNotes, notebooks } = useNotes();

  const [query, setQuery] = useState<string>("");

  console.log("[SearchScreen] Rendering, query:", query || "(empty)");

  const results = useMemo(() => searchNotes(query), [searchNotes, query]);

  const getNotebookName = useCallback(
    (notebookId: string) => {
      return notebooks.find((nb) => nb.id === notebookId)?.name ?? "";
    },
    [notebooks],
  );

  const handleNotePress = useCallback(
    (note: Note) => {
      console.log("[Search] Opening note:", note.title, "id:", note.id);

      router.push({
        pathname: "/note-editor",
        params: {
          noteId: note.id,
          notebookId: note.notebookId,
        },
      });
    },
    [router],
  );

  const renderNote = useCallback(
    ({ item }: { item: Note }) => (
      <NoteListItem
        note={item}
        onPress={() => handleNotePress(item)}
        showNotebook={getNotebookName(item.notebookId)}
      />
    ),
    [handleNotePress, getNotebookName],
  );

  const keyExtractor = useCallback((item: Note) => item.id, []);

  const handleClearSearch = useCallback(() => {
    console.log("[Search] Clearing search query");
    setQuery("");
  }, []);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      testID="search-screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchBar}>
        <SearchIcon size={18} color={Colors.textMuted} />

        <TextInput
          style={styles.searchInput}
          placeholder="Search all notes..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
          testID="input-search"
        />

        {query.length > 0 && (
          <Pressable
            onPress={handleClearSearch}
            hitSlop={8}
            testID="btn-clear-search"
          >
            <X size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {query.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <SearchIcon size={48} color={Colors.textMuted} />
          </View>

          <Text style={styles.emptyTitle}>Search your notes</Text>

          <Text style={styles.emptySubtitle}>
            Find anything across all your notebooks
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No results found</Text>

          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderNote}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {results.length} {results.length === 1 ? "result" : "results"}{" "}
              found
            </Text>
          }
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
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },

    title: {
      fontSize: 28,
      fontWeight: "800" as const,
      color: Colors.text,
      letterSpacing: -0.5,
    },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.inputBorder,
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 14,
      height: 48,
      gap: 10,
    },

    searchInput: {
      flex: 1,
      color: Colors.text,
      fontSize: 15,
      height: 48,
    },

    listContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
    },

    resultCount: {
      fontSize: 13,
      color: Colors.textMuted,
      marginBottom: 12,
      fontWeight: "500" as const,
    },

    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 80,
      gap: 12,
    },

    emptyIconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: Colors.textSecondary,
    },

    emptySubtitle: {
      fontSize: 14,
      color: Colors.textMuted,
      textAlign: "center",
      paddingHorizontal: 40,
    },
  });
