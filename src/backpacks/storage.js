// Backpacks are the existing "notebooks" and notes are the existing "entries".
// The storage key and shape are unchanged so notes saved by the old UI keep working;
// this module only adds optional fields (icon, color, description, homeIds, pinned, redaction).

export const HOME_LIMIT = 3;

export const BACKPACK_COLORS = [
  "#a9a5c6",
  "#8fb5ad",
  "#b9b9b9",
  "#c9a17f",
  "#7f9fca",
  "#d0969b",
  "#7392c0",
  "#9aa57f",
  "#d39f88",
  "#7c7f85",
];

export const BACKPACK_ICONS = [
  "backpack",
  "music",
  "book",
  "lightbulb",
  "briefcase",
  "heart",
  "plane",
  "users",
  "dots",
  "pen",
  "star",
  "camera",
];

const DEFAULT_BACKPACKS = [
  { name: "School", icon: "backpack", color: BACKPACK_COLORS[0], description: "Classes, notes, research" },
  { name: "Art", icon: "music", color: BACKPACK_COLORS[1], description: "Music, poetry, lyrics" },
  { name: "Diary", icon: "book", color: BACKPACK_COLORS[2], description: "Days, feelings, memories" },
  { name: "Ideas", icon: "lightbulb", color: BACKPACK_COLORS[3], description: "" },
  { name: "Work", icon: "briefcase", color: BACKPACK_COLORS[4], description: "" },
  { name: "Health", icon: "heart", color: BACKPACK_COLORS[5], description: "" },
  { name: "Travel", icon: "plane", color: BACKPACK_COLORS[6], description: "" },
  { name: "People", icon: "users", color: BACKPACK_COLORS[7], description: "" },
  { name: "Other", icon: "dots", color: BACKPACK_COLORS[9], description: "" },
];

export function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function storageKeyForUser(user) {
  const userId = user?.id ?? user?.sub ?? "unknown";
  return `diary_state_v2_${userId}`;
}

function makeNotebook(name, createdAt, extra = {}) {
  return { id: uid(), name, createdAt, isLocked: false, passwordHash: null, ...extra };
}

function seedState() {
  // Stagger createdAt so "oldest first" keeps the default order.
  const base = Date.now();
  const notebooks = DEFAULT_BACKPACKS.map((b, i) => makeNotebook(b.name, new Date(base + i).toISOString(), b));
  return {
    notebooks,
    activeNotebookId: null,
    entries: [],
    homeIds: notebooks.slice(0, HOME_LIMIT).map((n) => n.id),
  };
}

// Same migrations the old BrainDrainApp ran on boot, kept verbatim in behavior.
function readLegacyShape(raw) {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    const now = new Date().toISOString();
    const first = makeNotebook("Notebook 1", now);
    return {
      notebooks: [first],
      activeNotebookId: first.id,
      entries: parsed.map((e) => ({ ...e, notebookId: e.notebookId ?? first.id })),
    };
  }
  if (parsed && !Array.isArray(parsed.notebooks)) {
    const now = new Date().toISOString();
    const first = makeNotebook("Notebook 1", now);
    return {
      notebooks: [first],
      activeNotebookId: parsed.activeNotebookId ?? first.id,
      entries: (parsed.entries ?? []).map((e) => ({ ...e, notebookId: e.notebookId ?? first.id })),
    };
  }
  const notebooksList = parsed.notebooks;
  const defaultNbId = notebooksList[0]?.id ?? uid();
  const entries = (parsed.entries ?? []).map((e) => ({ ...e, notebookId: e.notebookId ?? defaultNbId }));
  if (notebooksList.length === 0 && entries.length > 0) {
    const now = new Date().toISOString();
    return {
      notebooks: [{ id: defaultNbId, name: "Notebook 1", createdAt: now, isLocked: false, passwordHash: null }],
      activeNotebookId: defaultNbId,
      entries,
    };
  }
  return { ...parsed, notebooks: notebooksList, entries };
}

function normalize(state) {
  const notebooks = (state.notebooks ?? []).map((n, i) => ({
    ...n,
    isLocked: n.isLocked ?? false,
    passwordHash: n.passwordHash ?? null,
    icon: BACKPACK_ICONS.includes(n.icon) ? n.icon : "backpack",
    color: n.color ?? BACKPACK_COLORS[i % BACKPACK_COLORS.length],
    description: n.description ?? "",
  }));
  const ids = new Set(notebooks.map((n) => n.id));
  let homeIds = Array.isArray(state.homeIds) ? state.homeIds.filter((id) => ids.has(id)) : null;
  if (!homeIds) {
    homeIds = [...notebooks]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, HOME_LIMIT)
      .map((n) => n.id);
  }
  return { ...state, notebooks, entries: state.entries ?? [], homeIds: homeIds.slice(0, HOME_LIMIT) };
}

export function loadState(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return seedState();
    const state = readLegacyShape(raw);
    // A brand-new account with nothing saved gets the starter backpacks.
    if (state.notebooks.length === 0 && state.entries.length === 0) return seedState();
    return normalize(state);
  } catch {
    // Never overwrite unreadable data with a seed; start empty in memory instead.
    return { notebooks: [], activeNotebookId: null, entries: [], homeIds: [], unreadable: true };
  }
}

export function saveState(storageKey, state) {
  if (state.unreadable) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Storage full or blocked; keep working in memory.
  }
}

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export function formatLongDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
