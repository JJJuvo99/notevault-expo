import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { CalendarEvent, JournalEntry, Habit, HabitLog } from '@/types';

const EVENTS_KEY = 'notevault_calendar_events';
const JOURNAL_KEY = 'notevault_journal_entries';
const HABITS_KEY = 'notevault_habits';
const HABIT_LOGS_KEY = 'notevault_habit_logs';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const EVENT_COLORS = ['#4F7CFF', '#FF6B6B', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#38BDF8'];

const DEFAULT_HABITS: Omit<Habit, 'id' | 'createdAt'>[] = [
  { name: 'Exercise', icon: 'dumbbell', color: '#34D399' },
  { name: 'Read', icon: 'book-open', color: '#4F7CFF' },
  { name: 'Meditate', icon: 'brain', color: '#A78BFA' },
  { name: 'Water', icon: 'droplets', color: '#38BDF8' },
  { name: 'Sleep 8h', icon: 'moon', color: '#6366F1' },
];

export const [CalendarJournalProvider, useCalendarJournal] = createContextHook(() => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedEvents, storedJournal, storedHabits, storedLogs] = await Promise.all([
          AsyncStorage.getItem(EVENTS_KEY),
          AsyncStorage.getItem(JOURNAL_KEY),
          AsyncStorage.getItem(HABITS_KEY),
          AsyncStorage.getItem(HABIT_LOGS_KEY),
        ]);

        if (storedEvents) setEvents(JSON.parse(storedEvents));
        if (storedJournal) setJournalEntries(JSON.parse(storedJournal));

        if (storedHabits) {
          setHabits(JSON.parse(storedHabits));
        } else {
          const defaults: Habit[] = DEFAULT_HABITS.map((h) => ({
            ...h,
            id: generateId(),
            createdAt: new Date().toISOString(),
          }));
          setHabits(defaults);
          await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(defaults));
        }

        if (storedLogs) setHabitLogs(JSON.parse(storedLogs));

        console.log('[CalendarJournal] Loaded data');
      } catch (e) {
        console.log('[CalendarJournal] Failed to load:', e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const persistEvents = useCallback(async (data: CalendarEvent[]) => {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(data));
  }, []);

  const persistJournal = useCallback(async (data: JournalEntry[]) => {
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(data));
  }, []);

  const persistHabits = useCallback(async (data: Habit[]) => {
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(data));
  }, []);

  const persistHabitLogs = useCallback(async (data: HabitLog[]) => {
    await AsyncStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(data));
  }, []);

  const addEvent = useCallback((title: string, date: string, startTime?: string, endTime?: string, description?: string) => {
    const event: CalendarEvent = {
      id: generateId(),
      title,
      date,
      startTime,
      endTime,
      color: EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)],
      description,
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => {
      const updated = [...prev, event];
      void persistEvents(updated);
      return updated;
    });
    console.log('[Calendar] Added event:', title);
    return event;
  }, [persistEvents]);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      void persistEvents(updated);
      return updated;
    });
  }, [persistEvents]);

  const getEventsForDate = useCallback((date: string) => {
    return events
      .filter((e) => e.date === date)
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  }, [events]);

  const getEventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach((e) => dates.add(e.date));
    return dates;
  }, [events]);

  const addJournalEntry = useCallback((date: string, mood: JournalEntry['mood'], content: string, gratitude?: string) => {
    const entry: JournalEntry = {
      id: generateId(),
      date,
      mood,
      content,
      gratitude,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => {
      const updated = [entry, ...prev];
      void persistJournal(updated);
      return updated;
    });
    console.log('[Journal] Added entry for:', date);
    return entry;
  }, [persistJournal]);

  const updateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    setJournalEntries((prev) => {
      const updated = prev.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      );
      void persistJournal(updated);
      return updated;
    });
  }, [persistJournal]);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournalEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      void persistJournal(updated);
      return updated;
    });
  }, [persistJournal]);

  const getJournalForDate = useCallback((date: string) => {
    return journalEntries.find((e) => e.date === date);
  }, [journalEntries]);

  const addHabit = useCallback((name: string, icon: string, color: string) => {
    const habit: Habit = {
      id: generateId(),
      name,
      icon,
      color,
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => {
      const updated = [...prev, habit];
      void persistHabits(updated);
      return updated;
    });
    return habit;
  }, [persistHabits]);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      void persistHabits(updated);
      return updated;
    });
    setHabitLogs((prev) => {
      const updated = prev.filter((l) => l.habitId !== id);
      void persistHabitLogs(updated);
      return updated;
    });
  }, [persistHabits, persistHabitLogs]);

  const toggleHabitLog = useCallback((habitId: string, date: string) => {
    setHabitLogs((prev) => {
      const existing = prev.find((l) => l.habitId === habitId && l.date === date);
      let updated: HabitLog[];
      if (existing) {
        updated = prev.map((l) =>
          l.habitId === habitId && l.date === date ? { ...l, completed: !l.completed } : l
        );
      } else {
        updated = [...prev, { habitId, date, completed: true }];
      }
      void persistHabitLogs(updated);
      return updated;
    });
  }, [persistHabitLogs]);

  const getHabitLogsForDate = useCallback((date: string) => {
    return habitLogs.filter((l) => l.date === date);
  }, [habitLogs]);

  const getHabitStreak = useCallback((habitId: string) => {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = habitLogs.find((l) => l.habitId === habitId && l.date === dateStr && l.completed);
      if (log) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [habitLogs]);

  return useMemo(() => ({
    events,
    journalEntries,
    habits,
    habitLogs,
    isLoading,
    addEvent,
    deleteEvent,
    getEventsForDate,
    getEventDates,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalForDate,
    addHabit,
    deleteHabit,
    toggleHabitLog,
    getHabitLogsForDate,
    getHabitStreak,
  }), [events, journalEntries, habits, habitLogs, isLoading, addEvent, deleteEvent, getEventsForDate, getEventDates, addJournalEntry, updateJournalEntry, deleteJournalEntry, getJournalForDate, addHabit, deleteHabit, toggleHabitLog, getHabitLogsForDate, getHabitStreak]);
});
