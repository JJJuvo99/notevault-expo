import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Notebook, Note } from '@/types';
import { DEFAULT_NOTEBOOKS } from '@/constants/defaults';

const NOTEBOOKS_KEY = 'notevault_notebooks';
const NOTES_KEY = 'notevault_notes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export const [NotesProvider, useNotes] = createContextHook(() => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedNotebooks, storedNotes] = await Promise.all([
          AsyncStorage.getItem(NOTEBOOKS_KEY),
          AsyncStorage.getItem(NOTES_KEY),
        ]);

        if (storedNotebooks) {
          setNotebooks(JSON.parse(storedNotebooks));
        } else {
          const defaults: Notebook[] = DEFAULT_NOTEBOOKS.map((nb) => ({
            ...nb,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setNotebooks(defaults);
          await AsyncStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(defaults));
        }

        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        }

        console.log('[Notes] Loaded data');
      } catch (e) {
        console.log('[Notes] Failed to load:', e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const persistNotebooks = useCallback(async (data: Notebook[]) => {
    await AsyncStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(data));
  }, []);

  const persistNotes = useCallback(async (data: Note[]) => {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(data));
  }, []);

  const addNotebook = useCallback(async (name: string, subtitle: string) => {
    const nb: Notebook = {
      id: generateId(),
      name,
      subtitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      noteCount: 0,
    };
    setNotebooks((prev) => {
      const updated = [...prev, nb];
      void persistNotebooks(updated);
      return updated;
    });
    console.log('[Notes] Added notebook:', name);
    return nb;
  }, [persistNotebooks]);

  const updateNotebook = useCallback(async (id: string, updates: Partial<Notebook>) => {
    setNotebooks((prev) => {
      const updated = prev.map((nb) =>
        nb.id === id ? { ...nb, ...updates, updatedAt: new Date().toISOString() } : nb
      );
      void persistNotebooks(updated);
      return updated;
    });
  }, [persistNotebooks]);

  const deleteNotebook = useCallback(async (id: string) => {
    setNotebooks((prev) => {
      const updated = prev.filter((nb) => nb.id !== id);
      void persistNotebooks(updated);
      return updated;
    });
    setNotes((prev) => {
      const updated = prev.filter((n) => n.notebookId !== id);
      void persistNotes(updated);
      return updated;
    });
    console.log('[Notes] Deleted notebook:', id);
  }, [persistNotebooks, persistNotes]);

  const addNote = useCallback(async (notebookId: string, title: string, content: string, plainText: string) => {
    const note: Note = {
      id: generateId(),
      notebookId,
      title: title || 'Untitled',
      content,
      plainText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
    };
    setNotes((prev) => {
      const updated = [note, ...prev];
      void persistNotes(updated);
      return updated;
    });
    setNotebooks((prev) => {
      const updated = prev.map((nb) =>
        nb.id === notebookId
          ? { ...nb, noteCount: nb.noteCount + 1, updatedAt: new Date().toISOString() }
          : nb
      );
      void persistNotebooks(updated);
      return updated;
    });
    console.log('[Notes] Added note:', title);
    return note;
  }, [persistNotes, persistNotebooks]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      );
      void persistNotes(updated);
      return updated;
    });
  }, [persistNotes]);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => {
      const note = prev.find((n) => n.id === id);
      const updated = prev.filter((n) => n.id !== id);
      void persistNotes(updated);

      if (note) {
        setNotebooks((prevNb) => {
          const updatedNb = prevNb.map((nb) =>
            nb.id === note.notebookId
              ? { ...nb, noteCount: Math.max(0, nb.noteCount - 1), updatedAt: new Date().toISOString() }
              : nb
          );
          void persistNotebooks(updatedNb);
          return updatedNb;
        });
      }
      return updated;
    });
    console.log('[Notes] Deleted note:', id);
  }, [persistNotes, persistNotebooks]);

  const togglePin = useCallback(async (id: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
      );
      void persistNotes(updated);
      return updated;
    });
  }, [persistNotes]);

  const getNotebookNotes = useCallback((notebookId: string) => {
    return notes
      .filter((n) => n.notebookId === notebookId)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes]);

  const recentNotes = useMemo(() => {
    return [...notes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ).slice(0, 50);
  }, [notes]);

  const searchNotes = useCallback((query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.plainText.toLowerCase().includes(q)
    ).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [notes]);

  return useMemo(() => ({
    notebooks,
    notes,
    isLoading,
    addNotebook,
    updateNotebook,
    deleteNotebook,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    getNotebookNotes,
    recentNotes,
    searchNotes,
  }), [notebooks, notes, isLoading, addNotebook, updateNotebook, deleteNotebook, addNote, updateNote, deleteNote, togglePin, getNotebookNotes, recentNotes, searchNotes]);
});

export function useNotebookById(id: string) {
  const { notebooks } = useNotes();
  return useMemo(() => notebooks.find((nb) => nb.id === id), [notebooks, id]);
}

export function useNoteById(id: string) {
  const { notes } = useNotes();
  return useMemo(() => notes.find((n) => n.id === id), [notes, id]);
}
