import { Notebook } from '@/types';

export const DEFAULT_NOTEBOOKS: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Personal', subtitle: 'Notes', noteCount: 0 },
  { name: 'Work', subtitle: 'Notes', noteCount: 0 },
  { name: 'Scrapbook', subtitle: 'Ideas', noteCount: 0 },
  { name: 'Calendar', subtitle: 'Events & Schedule', noteCount: 0 },
  { name: 'Journal', subtitle: 'Daily Entries', noteCount: 0 },
];
