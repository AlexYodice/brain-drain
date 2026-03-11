/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'diary-entries';

const EntriesContext = createContext(null);

function readStoredEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function EntriesProvider({ children }) {
  const [entries, setEntries] = useState(readStoredEntries);

  const saveEntries = useCallback((next) => {
    setEntries((prev) => {
      const list = typeof next === 'function' ? next(prev) : next;
      const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      } catch (e) {
        console.warn('Failed to save entries', e);
      }
      return sorted;
    });
  }, []);

  const addEntry = useCallback(
    (entry) => {
      const id = crypto.randomUUID?.() ?? `entry-${Date.now()}`;
      const created = {
        id,
        title: entry.title || 'Untitled',
        body: entry.body || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveEntries((prev) => [created, ...prev]);
      return created.id;
    },
    [saveEntries]
  );

  const updateEntry = useCallback(
    (id, updates) => {
      saveEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    },
    [saveEntries]
  );

  const deleteEntry = useCallback(
    (id) => {
      saveEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [saveEntries]
  );

  const getEntry = useCallback(
    (id) => entries.find((e) => e.id === id) ?? null,
    [entries]
  );

  const searchEntries = useCallback(
    (query) => {
      if (!query?.trim()) return entries;
      const q = query.trim().toLowerCase();
      return entries.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.body && e.body.toLowerCase().includes(q))
      );
    },
    [entries]
  );

  const value = {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    searchEntries,
  };

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used within EntriesProvider');
  return ctx;
}
