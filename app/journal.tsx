import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  Plus,
  Trash2,
  X,
  Smile,
  Meh,
  Frown,
  Heart,
  CloudRain,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCalendarJournal } from '@/providers/CalendarJournalProvider';
import { JournalEntry, Habit } from '@/types';

const MOOD_OPTIONS: { key: JournalEntry['mood']; label: string; color: string }[] = [
  { key: 'great', label: 'Great', color: '#34D399' },
  { key: 'good', label: 'Good', color: '#4F7CFF' },
  { key: 'okay', label: 'Okay', color: '#FBBF24' },
  { key: 'bad', label: 'Bad', color: '#F97316' },
  { key: 'awful', label: 'Awful', color: '#FF4D6A' },
];

function getMoodIcon(mood: JournalEntry['mood'], size: number, color: string) {
  switch (mood) {
    case 'great': return <Heart size={size} color={color} />;
    case 'good': return <Smile size={size} color={color} />;
    case 'okay': return <Meh size={size} color={color} />;
    case 'bad': return <Frown size={size} color={color} />;
    case 'awful': return <CloudRain size={size} color={color} />;
  }
}

function formatDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    habits,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalForDate,
    addHabit,
    deleteHabit,
    toggleHabitLog,
    getHabitLogsForDate,
    getHabitStreak,
    journalEntries,
  } = useCalendarJournal();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(formatDateStr(today));
  const [showAddHabit, setShowAddHabit] = useState<boolean>(false);
  const [newHabitName, setNewHabitName] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const selectedDateObj = useMemo(() => new Date(selectedDate + 'T12:00:00'), [selectedDate]);

  const journalEntry = useMemo(
    () => getJournalForDate(selectedDate),
    [getJournalForDate, selectedDate]
  );

  const habitLogsForDate = useMemo(
    () => getHabitLogsForDate(selectedDate),
    [getHabitLogsForDate, selectedDate]
  );

  const [editingJournal, setEditingJournal] = useState<boolean>(false);
  const [journalContent, setJournalContent] = useState<string>('');
  const [journalGratitude, setJournalGratitude] = useState<string>('');
  const [journalMood, setJournalMood] = useState<JournalEntry['mood']>('good');

  const dateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday = selectedDate === formatDateStr(today);

  console.log('[JournalScreen] Rendering for date:', selectedDate, 'isToday:', isToday, 'habits:', habits.length);

  const navigateDay = useCallback((dir: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[Journal] Navigating day:', dir > 0 ? 'next' : 'previous');
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setSelectedDate((prev) => {
      const d = new Date(prev + 'T12:00:00');
      d.setDate(d.getDate() + dir);
      return formatDateStr(d);
    });
    setEditingJournal(false);
  }, [fadeAnim]);

  const openJournalEditor = useCallback(() => {
    console.log('[Journal] Opening editor for date:', selectedDate);
    if (journalEntry) {
      setJournalContent(journalEntry.content);
      setJournalGratitude(journalEntry.gratitude ?? '');
      setJournalMood(journalEntry.mood);
    } else {
      setJournalContent('');
      setJournalGratitude('');
      setJournalMood('good');
    }
    setEditingJournal(true);
  }, [journalEntry, selectedDate]);

  const saveJournal = useCallback(() => {
    if (!journalContent.trim()) {
      Alert.alert('Empty entry', 'Please write something in your journal before saving.');
      return;
    }
    console.log('[Journal] Saving entry for:', selectedDate, 'mood:', journalMood);
    if (journalEntry) {
      updateJournalEntry(journalEntry.id, {
        content: journalContent.trim(),
        gratitude: journalGratitude.trim() || undefined,
        mood: journalMood,
      });
    } else {
      addJournalEntry(selectedDate, journalMood, journalContent.trim(), journalGratitude.trim() || undefined);
    }
    setEditingJournal(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [journalEntry, journalContent, journalGratitude, journalMood, selectedDate, addJournalEntry, updateJournalEntry]);

  const handleDeleteEntry = useCallback(() => {
    if (!journalEntry) return;
    Alert.alert('Delete Entry', 'Are you sure you want to remove this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          console.log('[Journal] Deleting entry:', journalEntry.id);
          deleteJournalEntry(journalEntry.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [journalEntry, deleteJournalEntry]);

  const handleToggleHabit = useCallback((habitId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[Journal] Toggling habit:', habitId, 'for date:', selectedDate);
    toggleHabitLog(habitId, selectedDate);
  }, [toggleHabitLog, selectedDate]);

  const handleAddHabit = useCallback(() => {
    if (!newHabitName.trim()) return;
    console.log('[Journal] Adding new habit:', newHabitName.trim());
    const habitColors = ['#34D399', '#4F7CFF', '#A78BFA', '#F472B6', '#FBBF24', '#38BDF8'];
    addHabit(newHabitName.trim(), 'check', habitColors[Math.floor(Math.random() * habitColors.length)]);
    setNewHabitName('');
    setShowAddHabit(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newHabitName, addHabit]);

  const handleDeleteHabit = useCallback((habit: Habit) => {
    Alert.alert('Delete Habit', `Are you sure you want to remove "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          console.log('[Journal] Deleting habit:', habit.name, habit.id);
          deleteHabit(habit.id);
        },
      },
    ]);
  }, [deleteHabit]);

  const completedHabitsCount = useMemo(() => {
    return habitLogsForDate.filter((l) => l.completed).length;
  }, [habitLogsForDate]);

  const recentEntries = useMemo(() => {
    return journalEntries
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  }, [journalEntries]);

  const moodData = journalEntry ? MOOD_OPTIONS.find((m) => m.key === journalEntry.mood) : null;

  const completionPercent = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="journal-screen">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="btn-back-journal">
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Journal</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dateNav}>
          <Pressable onPress={() => navigateDay(-1)} style={styles.navArrow} testID="btn-prev-day">
            <ChevronLeft size={20} color={Colors.text} />
          </Pressable>
          <Animated.View style={[styles.dateCenter, { opacity: fadeAnim }]}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            {isToday && <Text style={styles.todayBadge}>Today</Text>}
          </Animated.View>
          <Pressable onPress={() => navigateDay(1)} style={styles.navArrow} testID="btn-next-day">
            <ChevronRight size={20} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habit Tracker</Text>
            <View style={styles.habitProgress}>
              <Text style={styles.habitProgressText}>
                {completedHabitsCount}/{habits.length} · {completionPercent}%
              </Text>
            </View>
          </View>

          <View style={styles.habitsGrid}>
            {habits.map((habit) => {
              const isCompleted = habitLogsForDate.some(
                (l) => l.habitId === habit.id && l.completed
              );
              const streak = getHabitStreak(habit.id);

              return (
                <Pressable
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    isCompleted && { backgroundColor: habit.color + '20', borderColor: habit.color + '40' },
                  ]}
                  onPress={() => handleToggleHabit(habit.id)}
                  onLongPress={() => handleDeleteHabit(habit)}
                  testID={`habit-${habit.id}`}
                >
                  <View style={[styles.habitCheckCircle, isCompleted && { backgroundColor: habit.color, borderColor: habit.color }]}>
                    {isCompleted ? (
                      <Check size={14} color="#fff" />
                    ) : (
                      <View style={styles.habitCheckEmpty} />
                    )}
                  </View>
                  <Text style={[styles.habitName, isCompleted && { color: Colors.text }]} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  {streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Flame size={10} color="#FBBF24" />
                      <Text style={styles.streakText}>{streak}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              style={styles.addHabitCard}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddHabit(true);
              }}
              testID="btn-add-habit"
            >
              <Plus size={18} color={Colors.textMuted} />
            </Pressable>
          </View>

          {showAddHabit && (
            <View style={styles.addHabitRow}>
              <TextInput
                style={styles.addHabitInput}
                placeholder="New habit name..."
                placeholderTextColor={Colors.textMuted}
                value={newHabitName}
                onChangeText={setNewHabitName}
                autoFocus
                onSubmitEditing={handleAddHabit}
                returnKeyType="done"
                testID="input-new-habit"
              />
              <Pressable style={styles.addHabitConfirm} onPress={handleAddHabit} testID="btn-confirm-habit">
                <Check size={18} color="#fff" />
              </Pressable>
              <Pressable style={styles.addHabitCancel} onPress={() => { setShowAddHabit(false); setNewHabitName(''); }}>
                <X size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Journal Entry</Text>
            {journalEntry && !editingJournal && (
              <View style={styles.entryActions}>
                <Pressable onPress={openJournalEditor} style={styles.editBtn} testID="btn-edit-journal">
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable onPress={handleDeleteEntry} style={styles.deleteBtn} testID="btn-delete-journal">
                  <Trash2 size={14} color={Colors.danger} />
                </Pressable>
              </View>
            )}
          </View>

          {editingJournal ? (
            <View style={styles.journalEditor}>
              <Text style={styles.editorLabel}>How are you feeling?</Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map((m) => (
                  <Pressable
                    key={m.key}
                    style={[
                      styles.moodOption,
                      journalMood === m.key && { backgroundColor: m.color + '25', borderColor: m.color },
                    ]}
                    onPress={() => {
                      setJournalMood(m.key);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    testID={`mood-${m.key}`}
                  >
                    {getMoodIcon(m.key, 20, journalMood === m.key ? m.color : Colors.textMuted)}
                    <Text style={[styles.moodLabel, journalMood === m.key && { color: m.color }]}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.editorLabel}>What's on your mind?</Text>
              <TextInput
                style={styles.journalInput}
                placeholder="Write your thoughts..."
                placeholderTextColor={Colors.textMuted}
                value={journalContent}
                onChangeText={setJournalContent}
                multiline
                textAlignVertical="top"
                testID="input-journal-content"
              />

              <Text style={styles.editorLabel}>Gratitude (optional)</Text>
              <TextInput
                style={[styles.journalInput, styles.gratitudeInput]}
                placeholder="What are you grateful for today?"
                placeholderTextColor={Colors.textMuted}
                value={journalGratitude}
                onChangeText={setJournalGratitude}
                multiline
                textAlignVertical="top"
                testID="input-journal-gratitude"
              />

              <View style={styles.editorButtons}>
                <Pressable style={styles.cancelEditorBtn} onPress={() => setEditingJournal(false)}>
                  <Text style={styles.cancelEditorText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveEditorBtn} onPress={saveJournal} testID="btn-save-journal">
                  <Text style={styles.saveEditorText}>Save Entry</Text>
                </Pressable>
              </View>
            </View>
          ) : journalEntry ? (
            <View style={styles.journalView}>
              <View style={styles.moodDisplay}>
                {getMoodIcon(journalEntry.mood, 24, moodData?.color ?? Colors.text)}
                <Text style={[styles.moodDisplayLabel, { color: moodData?.color ?? Colors.text }]}>
                  Feeling {moodData?.label.toLowerCase() ?? journalEntry.mood}
                </Text>
              </View>
              <Text style={styles.journalViewContent}>{journalEntry.content}</Text>
              {journalEntry.gratitude ? (
                <View style={styles.gratitudeBox}>
                  <Text style={styles.gratitudeLabel}>Grateful for</Text>
                  <Text style={styles.gratitudeText}>{journalEntry.gratitude}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Pressable style={styles.newEntryBtn} onPress={openJournalEditor} testID="btn-new-entry">
              <Plus size={20} color={Colors.accent} />
              <Text style={styles.newEntryText}>Write today's journal entry</Text>
            </Pressable>
          )}
        </View>

        {recentEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            <View style={styles.recentList}>
              {recentEntries.map((entry) => {
                const entryMood = MOOD_OPTIONS.find((m) => m.key === entry.mood);
                const entryDate = new Date(entry.date + 'T12:00:00');
                return (
                  <Pressable
                    key={entry.id}
                    style={styles.recentCard}
                    onPress={() => {
                      console.log('[Journal] Jumping to entry date:', entry.date);
                      setSelectedDate(entry.date);
                      setEditingJournal(false);
                    }}
                    testID={`recent-entry-${entry.id}`}
                  >
                    <View style={[styles.recentMoodDot, { backgroundColor: entryMood?.color ?? Colors.textMuted }]} />
                    <View style={styles.recentContent}>
                      <Text style={styles.recentDate}>
                        {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.recentPreview} numberOfLines={1}>
                        {entry.content}
                      </Text>
                    </View>
                    {getMoodIcon(entry.mood, 16, entryMood?.color ?? Colors.textMuted)}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  dateCenter: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  todayBadge: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  habitProgress: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.accentSoft,
  },
  habitProgressText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  habitCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitCheckEmpty: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  habitName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  streakText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FBBF24',
  },
  addHabitCard: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed' as const,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  addHabitInput: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 14,
    height: 42,
    color: Colors.text,
    fontSize: 14,
  },
  addHabitConfirm: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHabitCancel: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.accentSoft,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  journalEditor: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 18,
  },
  editorLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  moodOption: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    gap: 4,
    minWidth: 56,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  journalInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 120,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  gratitudeInput: {
    height: 60,
  },
  editorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelEditorBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelEditorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  saveEditorBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveEditorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  journalView: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 18,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  moodDisplayLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  journalViewContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  gratitudeBox: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(79,124,255,0.2)',
  },
  gratitudeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  gratitudeText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  newEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed' as const,
    paddingVertical: 32,
  },
  newEntryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  recentList: {
    gap: 8,
    marginTop: 10,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 12,
  },
  recentMoodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentContent: {
    flex: 1,
  },
  recentDate: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  recentPreview: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
