import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCalendarJournal } from '@/providers/CalendarJournalProvider';
import { CalendarEvent } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CELL_SIZE = Math.floor((SCREEN_WIDTH - 56) / 7);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, year, isCurrentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }
  return days;
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addEvent, deleteEvent, getEventsForDate, getEventDates } = useCalendarJournal();

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newStartTime, setNewStartTime] = useState<string>('09:00');
  const [newEndTime, setNewEndTime] = useState<string>('10:00');
  const [newDescription, setNewDescription] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  console.log('[CalendarScreen] Rendering for date:', selectedDate, 'month:', MONTH_NAMES[currentMonth], currentYear);

  const monthDays = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const selectedEvents = useMemo(
    () => getEventsForDate(selectedDate),
    [getEventsForDate, selectedDate]
  );

  const eventDatesSet = getEventDates;

  const navigateMonth = useCallback((dir: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[Calendar] Navigating month:', dir > 0 ? 'next' : 'previous');
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setCurrentMonth((prev) => {
      const next = prev + dir;
      if (next < 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      if (next > 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return next;
    });
  }, [fadeAnim]);

  const handleDayPress = useCallback((year: number, month: number, day: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = formatDateStr(year, month, day);
    console.log('[Calendar] Selected date:', dateStr);
    setSelectedDate(dateStr);
  }, []);

  const handleGoToToday = useCallback(() => {
    console.log('[Calendar] Jumping to today');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  }, [today, todayStr]);

  const handleAddEvent = useCallback(() => {
    if (!newTitle.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }
    console.log('[Calendar] Adding event:', newTitle.trim(), 'on', selectedDate);
    addEvent(newTitle.trim(), selectedDate, newStartTime, newEndTime, newDescription.trim() || undefined);
    setNewTitle('');
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewDescription('');
    setShowAddModal(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newTitle, selectedDate, newStartTime, newEndTime, newDescription, addEvent]);

  const handleDeleteEvent = useCallback((event: CalendarEvent) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          console.log('[Calendar] Deleting event:', event.title, event.id);
          deleteEvent(event.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteEvent]);

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const selectedDayLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="calendar-screen">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="btn-back-calendar">
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Pressable onPress={handleGoToToday} style={styles.todayBtn} testID="btn-today">
          <Text style={styles.todayBtnText}>Today</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.monthNav}>
          <Pressable onPress={() => navigateMonth(-1)} style={styles.navArrow} testID="btn-prev-month">
            <ChevronLeft size={22} color={Colors.text} />
          </Pressable>
          <Animated.Text style={[styles.monthLabel, { opacity: fadeAnim }]}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Animated.Text>
          <Pressable onPress={() => navigateMonth(1)} style={styles.navArrow} testID="btn-next-month">
            <ChevronRight size={22} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.dayLabelsRow}>
          {DAY_LABELS.map((label) => (
            <View key={label} style={[styles.dayLabelCell, { width: DAY_CELL_SIZE }]}>
              <Text style={styles.dayLabelText}>{label}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={[styles.daysGrid, { opacity: fadeAnim }]}>
          {monthDays.map((d, idx) => {
            const dateStr = formatDateStr(d.year, d.month, d.day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasEvents = eventDatesSet.has(dateStr);

            return (
              <Pressable
                key={`day-${idx}`}
                style={[
                  styles.dayCell,
                  { width: DAY_CELL_SIZE, height: DAY_CELL_SIZE, borderRadius: DAY_CELL_SIZE / 2 },
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => handleDayPress(d.year, d.month, d.day)}
                testID={`day-${dateStr}`}
              >
                <Text
                  style={[
                    styles.dayText,
                    !d.isCurrentMonth && styles.dayTextMuted,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {d.day}
                </Text>
                {hasEvents && (
                  <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        <View style={styles.scheduleSection}>
          <View style={styles.scheduleTitleRow}>
            <View>
              <Text style={styles.scheduleTitle}>{selectedDayLabel}</Text>
              <Text style={styles.scheduleSubtitle}>
                {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}
              </Text>
            </View>
            <Pressable
              style={styles.addEventBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddModal(true);
              }}
              testID="btn-add-event"
            >
              <Plus size={18} color="#fff" />
            </Pressable>
          </View>

          {selectedEvents.length === 0 ? (
            <View style={styles.emptySchedule}>
              <Text style={styles.emptyText}>No events scheduled</Text>
              <Text style={styles.emptySubtext}>Tap + to add an event for this day</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {selectedEvents.map((event) => (
                <Pressable
                  key={event.id}
                  style={[styles.eventCard, { borderLeftColor: event.color }]}
                  onLongPress={() => handleDeleteEvent(event)}
                  testID={`event-${event.id}`}
                >
                  <View style={styles.eventCardContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {(event.startTime || event.endTime) && (
                      <View style={styles.eventTimeRow}>
                        <Clock size={12} color={Colors.textSecondary} />
                        <Text style={styles.eventTime}>
                          {event.startTime ?? ''}
                          {event.endTime ? ` — ${event.endTime}` : ''}
                        </Text>
                      </View>
                    )}
                    {event.description ? (
                      <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleDeleteEvent(event)}
                    style={styles.eventDeleteBtn}
                    hitSlop={8}
                    testID={`btn-delete-event-${event.id}`}
                  >
                    <Trash2 size={14} color={Colors.textMuted} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Event</Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={8}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalDate}>{selectedDayLabel}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Event title"
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              testID="input-event-title"
            />

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="09:00"
                  placeholderTextColor={Colors.textMuted}
                  value={newStartTime}
                  onChangeText={setNewStartTime}
                  testID="input-start-time"
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="10:00"
                  placeholderTextColor={Colors.textMuted}
                  value={newEndTime}
                  onChangeText={setNewEndTime}
                  testID="input-end-time"
                />
              </View>
            </View>

            <TextInput
              style={[styles.modalInput, styles.descInput]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textMuted}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              textAlignVertical="top"
              testID="input-event-desc"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewDescription('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalCreateBtn} onPress={handleAddEvent} testID="btn-create-event">
                <Text style={styles.modalCreateText}>Add Event</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    letterSpacing: -0.3,
  },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.accentSoft,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
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
  monthLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  dayLabelCell: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: Colors.accent,
  },
  dayCellToday: {
    backgroundColor: Colors.accentSoft,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  dayTextMuted: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  dayTextToday: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent,
    marginTop: 2,
    position: 'absolute' as const,
    bottom: 6,
  },
  eventDotSelected: {
    backgroundColor: '#fff',
  },
  scheduleSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  scheduleSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addEventBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  timelineContainer: {
    gap: 10,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  eventCardContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  eventDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  modalDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    height: 48,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  descInput: {
    height: 80,
    textAlignVertical: 'top' as const,
    paddingTop: 14,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  timeInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    height: 44,
    color: Colors.text,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  modalCreateBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCreateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
