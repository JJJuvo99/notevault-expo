export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Notebook {
  id: string;
  name: string;
  subtitle: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
}

export interface Note {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  plainText: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

export interface FormattingOption {
  id: string;
  icon: string;
  label: string;
  action: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'awful';
  content: string;
  gratitude?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}
