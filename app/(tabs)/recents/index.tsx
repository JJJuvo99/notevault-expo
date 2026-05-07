import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useNotes } from '@/providers/NotesProvider';
import NoteListItem from '@/components/NoteListItem';
import { Note } from '@/types';

export default function RecentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentNotes, notebooks } = useNotes();

  console.log('[RecentsScreen] Rendering with', recentNotes.length, 'recent notes');

  const getNotebookName = useCallback((notebookId: string) => {
    return notebooks.find((nb) => nb.id === notebookId)?.name ?? '';
  }, [notebooks]);

  const handleNotePress = useCallback((note: Note) => {
    console.log('[Recents] Opening note:', note.title, 'id:', note.id);
    router.push({ pathname: '/note-editor', params: { noteId: note.id, notebookId: note.notebookId } });
  }, [router]);

  const renderNote = useCallback(({ item }: { item: Note }) => (
    <NoteListItem
      note={item}
      onPress={() => handleNotePress(item)}
      showNotebook={getNotebookName(item.notebookId)}
    />
  ), [handleNotePress, getNotebookName]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyState} testID="recents-empty">
      <View style={styles.emptyIconWrapper}>
        <Clock size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No recent notes</Text>
      <Text style={styles.emptySubtitle}>Notes you edit will appear here for quick access</Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item: Note) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="recents-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Recents</Text>
        {recentNotes.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{recentNotes.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={recentNotes}
        renderItem={renderNote}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.accentSoft,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
