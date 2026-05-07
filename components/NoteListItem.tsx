import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Pin, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Note } from '@/types';

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

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NoteListItem({ note, onPress, onLongPress, showNotebook }: NoteListItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const preview = note.plainText.slice(0, 120).replace(/\n/g, ' ');

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
              {note.isPinned && <Pin size={14} color={Colors.accent} style={styles.pinIcon} />}
              <Text style={styles.title} numberOfLines={1}>{note.title}</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </View>
          {preview.length > 0 && (
            <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
            {showNotebook && <Text style={styles.notebook}>{showNotebook}</Text>}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(NoteListItem);

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pinIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  preview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  notebook: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
});
