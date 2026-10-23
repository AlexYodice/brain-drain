/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HOME_LIMIT, loadState, saveState, sha256, storageKeyForUser, uid } from "./storage";

const BackpackContext = createContext(null);

export function BackpackProvider({ user, onLogout, children }) {
  const storageKey = useMemo(() => storageKeyForUser(user), [user]);
  const [state, setState] = useState(() => loadState(storageKey));
  // Locked backpacks unlocked during this session only; never persisted.
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());

  useEffect(() => {
    saveState(storageKey, state);
  }, [state, storageKey]);

  const backpacks = state.notebooks;
  const notes = state.entries;

  const getBackpack = useCallback((id) => backpacks.find((b) => b.id === id) ?? null, [backpacks]);
  const getNote = useCallback((id) => notes.find((n) => n.id === id) ?? null, [notes]);
  const notesIn = useCallback((backpackId) => notes.filter((n) => n.notebookId === backpackId), [notes]);
  const isOpenable = useCallback(
    (backpack) => Boolean(backpack) && (!backpack.isLocked || unlockedIds.has(backpack.id)),
    [unlockedIds]
  );

  const homeBackpacks = useMemo(
    () => state.homeIds.map((id) => backpacks.find((b) => b.id === id)).filter(Boolean),
    [state.homeIds, backpacks]
  );

  const createBackpack = useCallback(({ name, icon, color, description }) => {
    const backpack = {
      id: uid(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      isLocked: false,
      passwordHash: null,
      icon,
      color,
      description: description?.trim() ?? "",
    };
    setState((prev) => ({ ...prev, notebooks: [...prev.notebooks, backpack] }));
    return backpack;
  }, []);

  const updateBackpack = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      notebooks: prev.notebooks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const deleteBackpack = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      notebooks: prev.notebooks.filter((b) => b.id !== id),
      entries: prev.entries.filter((e) => e.notebookId !== id),
      homeIds: prev.homeIds.filter((h) => h !== id),
      activeNotebookId: prev.activeNotebookId === id ? null : prev.activeNotebookId,
    }));
  }, []);

  const toggleHome = useCallback((id) => {
    setState((prev) => {
      if (prev.homeIds.includes(id)) return { ...prev, homeIds: prev.homeIds.filter((h) => h !== id) };
      if (prev.homeIds.length >= HOME_LIMIT) return prev;
      return { ...prev, homeIds: [...prev.homeIds, id] };
    });
  }, []);

  const createNote = useCallback(({ backpackId, title, text, redaction }) => {
    const now = new Date().toISOString();
    const note = {
      id: uid(),
      notebookId: backpackId,
      title: title.trim() || "Untitled",
      text,
      createdAt: now,
      updatedAt: now,
      pinned: false,
      redaction: Boolean(redaction),
    };
    setState((prev) => ({ ...prev, entries: [note, ...prev.entries], activeNotebookId: backpackId }));
    return note;
  }, []);

  const updateNote = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e)),
    }));
  }, []);

  const appendToNote = useCallback((id, chunk) => {
    if (!chunk) return;
    setState((prev) => ({
      ...prev,
      entries: prev.entries.map((e) =>
        e.id === id
          ? { ...e, text: `${e.text ?? ""}${chunk}`.replace(/\n{3,}/g, "\n\n"), updatedAt: new Date().toISOString() }
          : e
      ),
    }));
  }, []);

  const deleteNote = useCallback((id) => {
    setState((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
  }, []);

  // Lock flows keep the existing prompt + SHA-256 behavior from the old notebook menu.
  const unlockForSession = useCallback(async (backpack) => {
    if (!backpack?.passwordHash) return true;
    const pwd = prompt(`"${backpack.name}" is locked. Enter password:`);
    if (pwd == null) return false;
    try {
      if ((await sha256(pwd)) !== backpack.passwordHash) {
        alert("Wrong password.");
        return false;
      }
    } catch {
      alert("Could not verify password. Locked backpacks need HTTPS or localhost.");
      return false;
    }
    setUnlockedIds((prev) => new Set(prev).add(backpack.id));
    return true;
  }, []);

  const lockBackpack = useCallback(
    async (backpack) => {
      const pwd = prompt("Set a password for this backpack:");
      if (!pwd) return;
      if (prompt("Confirm password:") !== pwd) {
        alert("Passwords did not match.");
        return;
      }
      try {
        updateBackpack(backpack.id, { isLocked: true, passwordHash: await sha256(pwd) });
        setUnlockedIds((prev) => new Set(prev).add(backpack.id));
      } catch {
        alert("Could not set password. Use HTTPS or localhost.");
      }
    },
    [updateBackpack]
  );

  const removeLock = useCallback(
    async (backpack) => {
      const pwd = prompt("Enter password to remove the lock:");
      if (pwd == null) return;
      try {
        if ((await sha256(pwd)) !== backpack.passwordHash) {
          alert("Wrong password.");
          return;
        }
        updateBackpack(backpack.id, { isLocked: false, passwordHash: null });
      } catch {
        alert("Could not verify password. Try again.");
      }
    },
    [updateBackpack]
  );

  const value = useMemo(
    () => ({
      user,
      onLogout,
      backpacks,
      homeBackpacks,
      homeIds: state.homeIds,
      unreadable: Boolean(state.unreadable),
      getBackpack,
      getNote,
      notesIn,
      isOpenable,
      createBackpack,
      updateBackpack,
      deleteBackpack,
      toggleHome,
      createNote,
      updateNote,
      appendToNote,
      deleteNote,
      unlockForSession,
      lockBackpack,
      removeLock,
    }),
    [
      user,
      onLogout,
      backpacks,
      homeBackpacks,
      state.homeIds,
      state.unreadable,
      getBackpack,
      getNote,
      notesIn,
      isOpenable,
      createBackpack,
      updateBackpack,
      deleteBackpack,
      toggleHome,
      createNote,
      updateNote,
      appendToNote,
      deleteNote,
      unlockForSession,
      lockBackpack,
      removeLock,
    ]
  );

  return <BackpackContext.Provider value={value}>{children}</BackpackContext.Provider>;
}

export function useBackpacks() {
  const ctx = useContext(BackpackContext);
  if (!ctx) throw new Error("useBackpacks must be used inside BackpackProvider.");
  return ctx;
}
