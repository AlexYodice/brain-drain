import { useEffect, useMemo, useRef, useState } from "react";
const LYRIC_LINE_COMMAND = /\b(?:new line|next line|line break|new paragraph)\b/i;
const LYRIC_LINE_COMMAND_GLOBAL = /\b(?:new line|next line|line break|new paragraph)\b/gi;
const LYRIC_PAUSE_BREAK_MS = 1400;
const TRANSCRIBE_LANGUAGES = [
  { label: "Auto (Browser)", value: "auto" },
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "Spanish (US)", value: "es-US" },
  { label: "Spanish (Puerto Rico)", value: "es-PR" },
  { label: "Spanish (Spain)", value: "es-ES" },
  { label: "Spanglish (English + Spanish)", value: "spanglish" },
  { label: "French", value: "fr-FR" },
  { label: "German", value: "de-DE" },
  { label: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "Italian", value: "it-IT" },
  { label: "Japanese", value: "ja-JP" },
  { label: "Korean", value: "ko-KR" },
  { label: "Hindi", value: "hi-IN" },
];

function getDefaultTranscribeLanguage() {
  if (typeof navigator === "undefined") return "auto";
  const browserLang = navigator.language;
  const supported = TRANSCRIBE_LANGUAGES.some((item) => item.value === browserLang);
  return supported ? browserLang : "auto";
}

function getRecognitionLang(selection) {
  if (selection === "auto") return navigator.language || "en-US";
  if (selection === "spanglish") return "es-US";
  return selection;
}

function formatTranscriptChunk(rawChunk, { lyricsLineBreaks, pauseMs }) {
  if (!rawChunk) return "";

  const compact = rawChunk.replace(/\s+/g, " ").trim();
  if (!compact) return "";

  if (!lyricsLineBreaks) {
    return `${compact} `;
  }

  const explicitBreakRequested = LYRIC_LINE_COMMAND.test(rawChunk);
  const commandProcessed = rawChunk
    .replace(LYRIC_LINE_COMMAND_GLOBAL, "\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!commandProcessed) {
    return explicitBreakRequested ? "\n" : "";
  }

  const shouldBreakFromPause = typeof pauseMs === "number" && pauseMs > LYRIC_PAUSE_BREAK_MS;
  const prefix = shouldBreakFromPause ? "\n" : "";
  const suffix = commandProcessed.endsWith("\n") ? "" : "\n";

  return `${prefix}${commandProcessed}${suffix}`;
}

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function BrainDrainApp({ user, onLogout }) {
  const storageKey = useMemo(() => {
    const userId = user?.id ?? user?.sub ?? "unknown";
    return `diary_state_v2_${userId}`;
  }, [user]);

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const now = new Date().toISOString();
          const defaultNotebookId = uid();
          return {
            notebooks: [{ id: defaultNotebookId, name: "Notebook 1", createdAt: now, isLocked: false, passwordHash: null }],
            activeNotebookId: defaultNotebookId,
            entries: parsed.map((e) => ({ ...e, notebookId: e.notebookId ?? defaultNotebookId })),
          };
        }
        if (parsed && !Array.isArray(parsed.notebooks)) {
          const now = new Date().toISOString();
          const defaultNotebookId = uid();
          return {
            notebooks: [{ id: defaultNotebookId, name: "Notebook 1", createdAt: now, isLocked: false, passwordHash: null }],
            activeNotebookId: parsed.activeNotebookId ?? defaultNotebookId,
            entries: (parsed.entries ?? []).map((e) => ({ ...e, notebookId: e.notebookId ?? defaultNotebookId })),
          };
        }
        const notebooksList = Array.isArray(parsed.notebooks) ? parsed.notebooks : [];
        const defaultNbId = notebooksList[0]?.id ?? uid();
        const entriesWithNotebook = (parsed.entries ?? []).map((e) => ({
          ...e,
          notebookId: e.notebookId ?? defaultNbId,
        }));
        if (notebooksList.length === 0 && entriesWithNotebook.length > 0) {
          const now = new Date().toISOString();
          const first = { id: defaultNbId, name: "Notebook 1", createdAt: now, isLocked: false, passwordHash: null };
          return {
            notebooks: [first],
            activeNotebookId: defaultNbId,
            entries: entriesWithNotebook,
          };
        }
        if (notebooksList.length === 0) {
          return { notebooks: [], activeNotebookId: null, entries: [] };
        }
        const normalizedNotebooks = notebooksList.map((n) => ({
          ...n,
          isLocked: n.isLocked ?? false,
          passwordHash: n.passwordHash ?? null,
        }));
        return { ...parsed, notebooks: normalizedNotebooks, entries: entriesWithNotebook };
      }

      return { notebooks: [], activeNotebookId: null, entries: [] };
    } catch {
      return { notebooks: [], activeNotebookId: null, entries: [] };
    }
  });

  const notebooks = useMemo(() => state.notebooks ?? [], [state.notebooks]);
  const entries = useMemo(() => state.entries ?? [], [state.entries]);
  const activeNotebookId = useMemo(() => {
    if (notebooks.length === 0) return null;
    if (notebooks.some((notebook) => notebook.id === state.activeNotebookId)) {
      return state.activeNotebookId;
    }
    return notebooks[0]?.id ?? null;
  }, [notebooks, state.activeNotebookId]);

  const hasNotebooks = notebooks.length > 0;
  const setEntries = (updater) =>
    setState((prev) => ({
      ...prev,
      entries: typeof updater === "function" ? updater(prev.entries) : updater,
    }));

  const setActiveNotebookId = (id) =>
    setState((prev) => ({
      ...prev,
      activeNotebookId: id,
    }));

  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [notebookSearch, setNotebookSearch] = useState("");
  const [notebookSort, setNotebookSort] = useState("A_Z");
  const [pageSort, setPageSort] = useState("recent");
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [lyricsLineBreaks, setLyricsLineBreaks] = useState(false);
  const [transcribeLanguage, setTranscribeLanguage] = useState(getDefaultTranscribeLanguage);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [showNewNotebookInput, setShowNewNotebookInput] = useState(false);
  const newNotebookInputRef = useRef(null);
  const [view, setView] = useState("notebooks");
  const [openMenuNotebookId, setOpenMenuNotebookId] = useState(null);
  const menuRef = useRef(null);
  const [isNotebookSortMenuOpen, setIsNotebookSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);

  const recognitionRef = useRef(null);
  const recordingEntryIdRef = useRef(null);
  const lastFinalResultAtRef = useRef(null);

  const activeNotebook = useMemo(
    () => notebooks.find((n) => n.id === activeNotebookId) ?? null,
    [notebooks, activeNotebookId]
  );

  // Persist state
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const entriesInActiveNotebook = useMemo(
    () => entries.filter((e) => e.notebookId === activeNotebookId),
    [entries, activeNotebookId]
  );

  const resolvedActiveId = useMemo(() => {
    if (!activeNotebookId) return null;
    const currentPageInThisNotebook = entriesInActiveNotebook.some((entry) => entry.id === activeId);
    if (currentPageInThisNotebook) return activeId;
    const newest = [...entriesInActiveNotebook].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    return newest?.id ?? null;
  }, [activeNotebookId, entriesInActiveNotebook, activeId]);

  const activeEntry = useMemo(
    () => entries.find((e) => e.id === resolvedActiveId) ?? null,
    [entries, resolvedActiveId]
  );

  const filteredNotebooks = useMemo(() => {
    const q = notebookSearch.trim().toLowerCase();

    let list = [...(notebooks ?? [])];

    if (q) {
      list = list.filter((n) => (n.name || "").toLowerCase().includes(q));
    }

    if (notebookSort === "A_Z") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (notebookSort === "Z_A") {
      list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (notebookSort === "NEWEST") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (notebookSort === "OLDEST") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    return list;
  }, [notebooks, notebookSearch, notebookSort]);

  const filteredEntries = useMemo(() => {
    const inNotebook = entries.filter((e) => e.notebookId === activeNotebookId);

    const q = search.trim().toLowerCase();
    const filtered = !q
      ? inNotebook
      : inNotebook.filter((e) => {
          const hay = `${e.title}\n${e.text}`.toLowerCase();
          return hay.includes(q);
        });

    const sorted = [...filtered];
    if (pageSort === "recent") sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    else if (pageSort === "oldest") sorted.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    else if (pageSort === "az") sorted.sort((a, b) => (a.title || "Untitled").localeCompare(b.title || "Untitled"));
    else if (pageSort === "za") sorted.sort((a, b) => (b.title || "Untitled").localeCompare(a.title || "Untitled"));
    return sorted;
  }, [entries, activeNotebookId, search, pageSort]);

  const canUseSpeech = useMemo(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return Boolean(SR);
  }, []);

  const createNewEntry = () => {
    if (!activeNotebookId) return null;
    const now = new Date().toISOString();
    const e = {
      id: uid(),
      notebookId: activeNotebookId,
      title: "Untitled",
      text: "",
      createdAt: now,
      updatedAt: now,
    };
    setEntries((prev) => [e, ...prev]);
    setActiveId(e.id);
    setInterim("");
    return e.id;
  };

  const createNotebook = (name) => {
    const trimmed = name == null ? "" : String(name).trim();
    if (trimmed === "") return;

    const now = new Date().toISOString();
    const nb = { id: uid(), name: trimmed, createdAt: now, isLocked: false, passwordHash: null };

    setState((prev) => {
      const nextNotebooks = [nb, ...(Array.isArray(prev.notebooks) ? prev.notebooks : [])];
      return {
        ...prev,
        notebooks: nextNotebooks,
        activeNotebookId: nb.id,
      };
    });

    setActiveId(null);
    setInterim("");
    setNewNotebookName("");
    setShowNewNotebookInput(false);
  };

  const handleAddNotebook = () => {
    createNotebook(newNotebookName);
  };

  const updateNotebook = (id, patch) => {
    setState((prev) => ({
      ...prev,
      notebooks: (prev.notebooks ?? []).map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  };

  const renameNotebook = (id) => {
    const nb = notebooks.find((n) => n.id === id);
    if (!nb) {
      setOpenMenuNotebookId(null);
      return;
    }
    const name = prompt("Rename notebook:", nb.name ?? "");
    if (name == null) {
      setOpenMenuNotebookId(null);
      return;
    }
    const trimmed = String(name).trim();
    if (trimmed === "") {
      setOpenMenuNotebookId(null);
      return;
    }
    updateNotebook(id, { name: trimmed });
    setOpenMenuNotebookId(null);
  };

  const deleteNotebook = (id) => {
    setOpenMenuNotebookId(null);
    if (!confirm("Delete this notebook and all its pages? This cannot be undone.")) return;
    setState((prev) => {
      const nextNotebooks = (prev.notebooks ?? []).filter((n) => n.id !== id);
      const nextEntries = (prev.entries ?? []).filter((e) => e.notebookId !== id);
      let nextActive = prev.activeNotebookId;
      if (nextActive === id) {
        nextActive = nextNotebooks[0]?.id ?? null;
        setView("notebooks");
      }
      return { ...prev, notebooks: nextNotebooks, entries: nextEntries, activeNotebookId: nextActive };
    });
    if (activeNotebookId === id) setActiveId(null);
  };

  const lockNotebook = async (id) => {
    const pwd = prompt("Set a password for this notebook:");
    if (pwd == null || pwd === "") {
      setOpenMenuNotebookId(null);
      return;
    }
    const again = prompt("Confirm password:");
    if (again !== pwd) {
      alert("Passwords did not match.");
      setOpenMenuNotebookId(null);
      return;
    }
    try {
      const hash = await sha256(pwd);
      updateNotebook(id, { isLocked: true, passwordHash: hash });
      setOpenMenuNotebookId(null);
    } catch (err) {
      console.error(err);
      alert("Could not set password. Use HTTPS or localhost.");
      setOpenMenuNotebookId(null);
    }
  };

  const unlockNotebook = async (id) => {
    const nb = notebooks.find((n) => n.id === id);
    if (!nb?.passwordHash) {
      setOpenMenuNotebookId(null);
      return;
    }
    const pwd = prompt("Enter password to unlock:");
    if (pwd == null) {
      setOpenMenuNotebookId(null);
      return;
    }
    try {
      const hash = await sha256(pwd);
      if (hash !== nb.passwordHash) {
        alert("Wrong password.");
        setOpenMenuNotebookId(null);
        return;
      }
      updateNotebook(id, { isLocked: false, passwordHash: null });
      setOpenMenuNotebookId(null);
    } catch (err) {
      console.error(err);
      alert("Could not verify password. Try again.");
      setOpenMenuNotebookId(null);
    }
  };

  const goToNotebookWithLock = async (n) => {
    if (n.isLocked && n.passwordHash) {
      const pwd = prompt("This notebook is locked. Enter password:");
      if (pwd == null) return;
      const hash = await sha256(pwd);
      if (hash !== n.passwordHash) {
        alert("Wrong password.");
        return;
      }
    }
    goToNotebook(n.id);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuNotebookId(null);
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setIsNotebookSortMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showNewNotebookInput && newNotebookInputRef.current) {
      newNotebookInputRef.current.focus();
    }
  }, [showNewNotebookInput]);

  function stopRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors when recognition has already ended.
      }
      recognitionRef.current = null;
    }
    recordingEntryIdRef.current = null;
    lastFinalResultAtRef.current = null;
    setIsRecording(false);
    setInterim("");
  }

  const updateActive = (patch) => {
    if (!activeEntry) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === activeEntry.id
          ? { ...e, ...patch, updatedAt: new Date().toISOString() }
          : e
      )
    );
  };

  const appendToEntryText = (entryId, textToAppend) => {
    if (!entryId || !textToAppend) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              text: `${e.text ?? ""}${textToAppend}`.replace(/\n{3,}/g, "\n\n"),
              updatedAt: new Date().toISOString(),
            }
          : e
      )
    );
  };

  const deleteActive = () => {
    if (!activeEntry) return;
    const ok = confirm("Delete this page?");
    if (!ok) return;
    stopRecording();
    setEntries((prev) => prev.filter((e) => e.id !== activeEntry.id));
    setInterim("");
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Try Chrome or Edge.");
      return;
    }
    if (!activeNotebookId) return;
    const entryId = activeEntry?.id ?? createNewEntry();
    if (!entryId) return;
    recordingEntryIdRef.current = entryId;
    lastFinalResultAtRef.current = null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = getRecognitionLang(transcribeLanguage);

    rec.onresult = (event) => {
      console.log("Speech: onresult fired", event.results?.length);
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }

      if (finalText) {
        const nowTs = typeof event.timeStamp === "number" ? event.timeStamp : Date.now();
        const pauseMs =
          lastFinalResultAtRef.current == null ? null : nowTs - lastFinalResultAtRef.current;
        const chunk = formatTranscriptChunk(finalText, { lyricsLineBreaks, pauseMs });
        appendToEntryText(recordingEntryIdRef.current, chunk);
        lastFinalResultAtRef.current = nowTs;
      }
      setInterim(interimText);
    };

    rec.onerror = (event) => {
      console.log("Speech: error", event.error);
      setIsRecording(false);
      recognitionRef.current = null;
      recordingEntryIdRef.current = null;
      lastFinalResultAtRef.current = null;
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Allow the microphone for this site and try again.");
      }
    };

    rec.onend = (e) => {
      console.log("Speech: ended", e.error || e.reason || "(no error/reason)");
      setIsRecording(false);
      recognitionRef.current = null;
      recordingEntryIdRef.current = null;
      lastFinalResultAtRef.current = null;
      setInterim("");
    };

    recognitionRef.current = rec;
    rec.start();
    console.log("Speech: started");
    setIsRecording(true);
  };

  const runSpeechTest = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const lines = [];
    lines.push("SR exists? " + (!!SR));
    if (!SR) {
      alert(lines.join("\n") + "\n\nUse Chrome or Edge on desktop.");
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = getRecognitionLang(transcribeLanguage);
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      try {
        r.abort();
      } catch {
        // Ignore abort errors when recognition is already closed.
      }
      alert(lines.join("\n"));
    };
    r.onstart = () => { lines.push("TEST start"); };
    r.onresult = (e) => {
      let s = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        s += (e.results[i].isFinal ? "[final] " : "[interim] ") + e.results[i][0].transcript;
      }
      lines.push("TEST result: " + (s || "(empty)"));
    };
    r.onerror = (e) => { lines.push("TEST error: " + (e.error || "unknown")); setTimeout(done, 100); };
    r.onend = () => { lines.push("TEST end"); setTimeout(done, 100); };
    r.start();
    lines.push("TEST called start()");
    setTimeout(done, 5000);
  };

  const goToNotebook = (id) => {
    stopRecording();
    setActiveNotebookId(id);
    setView("pages");
  };

  const goBackToNotebooks = () => {
    stopRecording();
    setView("notebooks");
  };

  const selectEntry = (id) => {
    if (isRecording && id !== recordingEntryIdRef.current) {
      stopRecording();
    }
    setActiveId(id);
  };

  // NEON vibe: deep black, luminous green accent, clean sans-serif
  const styles = {
    app: { height: "100vh", display: "grid", gridTemplateColumns: "320px 1fr", fontFamily: "var(--font)", background: "#000" },
    sidebar: { borderRight: "1px solid #222", padding: 16, display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.6)" },
    headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    title: { margin: 0, fontSize: 38, fontWeight: 300, color: "#fff", letterSpacing: "0" },
    btn: { padding: "10px 16px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", cursor: "pointer", fontWeight: 500, transition: "all 0.2s ease" },
    btnPrimary: { padding: "10px 16px", borderRadius: 10, border: "none", background: "#fff", color: "#000", cursor: "pointer", fontWeight: 600, transition: "all 0.2s ease" },
    btnOutline: { padding: "10px 16px", borderRadius: 10, border: "1px solid #fff", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 500, transition: "all 0.2s ease" },
    btnDanger: { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,71,87,0.4)", background: "rgba(255,71,87,0.1)", color: "#ff4757", cursor: "pointer", fontWeight: 500 },
    input: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", outline: "none" },
    compactInput: { width: "100%", height: 42, padding: "8px 12px", borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", outline: "none", fontSize: 15 },
    iconBtn: {
      width: 52,
      height: 52,
      borderRadius: 16,
      border: "1px solid #2a2a2a",
      background: "#0d0f14",
      color: "#ffffff",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
    },
    list: { overflow: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 },
    item: (active) => ({
      padding: 12,
      borderRadius: 12,
      border: active ? "1px solid #00e676" : "1px solid #222",
      background: active ? "rgba(0,230,118,0.12)" : "#0a0a0a",
      color: "#fff",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: active ? "0 0 20px rgba(0,230,118,0.15)" : "none",
    }),
    itemTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" },
    itemMeta: { margin: "6px 0 0", fontSize: 12, color: "#a0a0a0" },
    main: { padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "transparent" },
    topBar: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    bigInput: { flex: 1, minWidth: 220, padding: 10, borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 16, outline: "none" },
    textarea: { width: "100%", flex: 1, minHeight: 260, resize: "vertical", padding: 12, borderRadius: 12, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 15, lineHeight: 1.6, outline: "none" },
    hint: { fontSize: 13, color: "#a0a0a0" },
    pill: { display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #333", background: "#111", color: "#a0a0a0", fontSize: 12 },
    sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 },
    sectionTitle: { margin: 0, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b6b6b" },
    select: { padding: "8px 10px", borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 13, cursor: "pointer", outline: "none" },
  };

  const editorValue = activeEntry
    ? activeEntry.text +
      (interim
        ? lyricsLineBreaks
          ? `${activeEntry.text.endsWith("\n") ? "" : "\n"}${interim}`
          : `\n${interim}`
        : "")
    : "";

  const brandIcon = (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: 24,
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <img
        src="/favicon.png"
        alt=""
        className="brand-icon-corner"
        style={{
          width: 220,
          height: 220,
          objectFit: "contain",
          opacity: 0.45,
          mixBlendMode: "screen",
          filter: "brightness(1.8) contrast(1.55)",
        }}
      />
      <span
        style={{
          color: "#ffffff",
          fontSize: 40,
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 500,
          letterSpacing: "0.015em",
          fontStyle: "normal",
          textShadow: "0 0 16px rgba(0, 230, 118, 0.28)",
        }}
      >
        Brain Drain
      </span>
    </div>
  );

  if (view === "notebooks") {
    return (
      <div className="neon-hero-bg" style={{ ...styles.app, gridTemplateColumns: "1fr", maxWidth: 520, margin: "0 auto", padding: 32 }}>
        {brandIcon}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ ...styles.pill, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email ?? user?.id ?? "Authenticated"}
          </span>
          <button type="button" style={styles.btnOutline} className="btn-outline" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div ref={sortMenuRef} style={{ marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              style={styles.compactInput}
              placeholder="Search notebooks..."
              value={notebookSearch}
              onChange={(e) => setNotebookSearch(e.target.value)}
            />
            <button
              type="button"
              style={styles.iconBtn}
              aria-label="Sort notebooks"
              title="Sort notebooks"
              onClick={() => setIsNotebookSortMenuOpen((v) => !v)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <line x1="3" y1="6" x2="13" y2="6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="17" y1="6" x2="21" y2="6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="15" cy="6" r="1.8" fill="#ffffff" />
                <line x1="3" y1="12" x2="7" y2="12" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="11" y1="12" x2="21" y2="12" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="9" cy="12" r="1.8" fill="#ffffff" />
                <line x1="3" y1="18" x2="13" y2="18" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="17" y1="18" x2="21" y2="18" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="15" cy="18" r="1.8" fill="#ffffff" />
              </svg>
            </button>
          </div>
          {isNotebookSortMenuOpen && (
            <div
              style={{
                marginTop: 8,
                marginLeft: "auto",
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: 10,
                padding: 6,
                width: 160,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4, padding: "8px 10px" }} onClick={() => { setNotebookSort("A_Z"); setIsNotebookSortMenuOpen(false); }}>
                A to Z
              </button>
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4, padding: "8px 10px" }} onClick={() => { setNotebookSort("Z_A"); setIsNotebookSortMenuOpen(false); }}>
                Z to A
              </button>
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4, padding: "8px 10px" }} onClick={() => { setNotebookSort("NEWEST"); setIsNotebookSortMenuOpen(false); }}>
                Most recent
              </button>
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", padding: "8px 10px" }} onClick={() => { setNotebookSort("OLDEST"); setIsNotebookSortMenuOpen(false); }}>
                Oldest
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            style={styles.btnPrimary}
            className="btn-primary"
            onClick={() => setShowNewNotebookInput((v) => !v)}
            aria-label="New notebook"
          >
            + New
          </button>
        </div>

        {showNewNotebookInput && (
          <div style={{ display: "flex", gap: 8, flexDirection: "column", marginTop: 4 }}>
            <input
              ref={newNotebookInputRef}
              style={styles.input}
              placeholder="Notebook name"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNotebook();
                if (e.key === "Escape") setShowNewNotebookInput(false);
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={styles.btnPrimary} className="btn-primary" onClick={handleAddNotebook} disabled={!newNotebookName.trim()}>
                Add notebook
              </button>
              <button type="button" style={styles.btnOutline} className="btn-outline" onClick={() => { setShowNewNotebookInput(false); setNewNotebookName(""); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ ...styles.list, flex: 1, minHeight: 200, marginTop: 12 }}>
          {filteredNotebooks.length === 0 ? (
            <div style={{ color: "#a0a0a0" }}>No notebooks yet. Click + New to create one.</div>
          ) : (
            filteredNotebooks.map((n) => (
              <div key={n.id} style={{ position: "relative" }}>
                <div
                  role="button"
                  tabIndex={0}
                  style={{ ...styles.item(n.id === activeNotebookId), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                  onClick={() => goToNotebookWithLock(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToNotebookWithLock(n);
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {n.isLocked && (
                      <span style={{ marginRight: 6, fontSize: 12 }} aria-label="Locked" title="Locked">
                        🔒
                      </span>
                    )}
                    <p style={styles.itemTitle}>{n.name}</p>
                    <p style={styles.itemMeta}>{formatDateTime(n.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.btn, padding: "4px 8px", fontSize: 16 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuNotebookId(openMenuNotebookId === n.id ? null : n.id);
                    }}
                    aria-label="Notebook options"
                  >
                    ⋯
                  </button>
                </div>
                {openMenuNotebookId === n.id && (
                  <div
                    ref={menuRef}
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 4,
                      background: "#0a0a0a",
                      border: "1px solid #222",
                      borderRadius: 10,
                      padding: 6,
                      minWidth: 120,
                      zIndex: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4 }} onClick={() => renameNotebook(n.id)}>
                      Rename
                    </button>
                    <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4 }} onClick={() => (n.isLocked ? unlockNotebook(n.id) : lockNotebook(n.id))}>
                      {n.isLocked ? "Unlock" : "Lock"}
                    </button>
                    <button type="button" style={{ ...styles.btnDanger, width: "100%", textAlign: "left" }} onClick={() => deleteNotebook(n.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {!hasNotebooks && (
          <div style={{ marginTop: 24 }}>
            <p style={{ margin: 0, color: "#a0a0a0", fontSize: 14 }}>Or create your first notebook below.</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <input
                style={{ ...styles.input, flex: 1, minWidth: 140 }}
                placeholder="Notebook name"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNotebook()}
              />
              <button type="button" style={styles.btnPrimary} className="btn-primary" onClick={handleAddNotebook} disabled={!newNotebookName.trim()}>
                Create notebook
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="neon-hero-bg" style={styles.app}>
      {brandIcon}
      <aside style={styles.sidebar}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            style={{ ...styles.btnOutline, alignSelf: "flex-start", marginBottom: 4 }}
            className="btn-outline"
            onClick={goBackToNotebooks}
            aria-label="Back to notebooks"
          >
            Back
          </button>
          <button
            type="button"
            style={{ ...styles.btn, marginBottom: 4 }}
            onClick={onLogout}
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "#fff", fontWeight: 600 }}>
          {activeNotebook?.name ?? "Notebook"}
        </h2>

        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Pages</span>
          <button type="button" style={styles.btnPrimary} className="btn-primary" onClick={createNewEntry}>
            New Page
          </button>
        </div>
        <input
          style={styles.input}
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={pageSort}
          onChange={(e) => setPageSort(e.target.value)}
          title="Sort pages"
        >
          <option value="recent">Most recent</option>
          <option value="oldest">Oldest</option>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
        </select>
        <div style={{ ...styles.list, flex: 1, minHeight: 0 }}>
          {filteredEntries.length === 0 ? (
            <div style={{ color: "#a0a0a0" }}>No pages yet. Hit "New Page".</div>
          ) : (
            filteredEntries.map((e) => (
              <div key={e.id} style={styles.item(e.id === resolvedActiveId)} onClick={() => selectEntry(e.id)}>
                <p style={styles.itemTitle}>{e.title || "Untitled"}</p>
                <p style={styles.itemMeta}>{formatDateTime(e.updatedAt)}</p>
              </div>
            ))
          )}
        </div>

        <div className="transcribe-panel">
          <div className="transcribe-head">
            <p className="transcribe-title">Transcribe</p>
            <span className={`transcribe-status ${isRecording ? "live" : ""}`}>
              {isRecording ? "Live" : canUseSpeech ? "Ready" : "Unsupported"}
            </span>
          </div>
          <div className="transcribe-language">
            <label htmlFor="transcribe-language">Language</label>
            <select
              id="transcribe-language"
              value={transcribeLanguage}
              onChange={(e) => setTranscribeLanguage(e.target.value)}
            >
              {TRANSCRIBE_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <p className="transcribe-copy">Record voice directly into the active page.</p>
          <label className="transcribe-toggle">
            <input
              type="checkbox"
              checked={lyricsLineBreaks}
              onChange={(e) => setLyricsLineBreaks(e.target.checked)}
            />
            <span>Lyrics mode (optional line break detection)</span>
          </label>
          <div className="transcribe-actions">
            <button style={styles.btnDanger} onClick={deleteActive} disabled={!activeEntry}>
              Delete
            </button>
            <button
              type="button"
              style={styles.btn}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!canUseSpeech}
              title={!canUseSpeech ? "Use Chrome/Edge for Speech Recognition" : ""}
            >
              {isRecording ? "Stop" : "Record"}
            </button>
            <button
              type="button"
              style={{ ...styles.btn, opacity: 0.9 }}
              onClick={runSpeechTest}
              title="Run speech diagnostic (no console needed)"
            >
              Test speech
            </button>
          </div>
          <div style={styles.hint}>
            {canUseSpeech ? (
              <span style={styles.pill}>Speech: Ready</span>
            ) : (
              <span style={styles.pill}>Speech: Not supported (try Chrome/Edge)</span>
            )}
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        {!activeEntry ? (
          <>
            <h2 style={{ margin: 0, color: "#fff", fontWeight: 600 }}>Create your first page</h2>
            <p style={{ margin: 0, color: "#a0a0a0" }}>
              Click <b style={{ color: "#00e676" }}>New Page</b>, then hit <b style={{ color: "#00e676" }}>Record</b> and talk.
            </p>
          </>
        ) : (
          <>
            <div style={styles.topBar}>
              <input
                style={styles.bigInput}
                value={activeEntry.title}
                onChange={(e) => updateActive({ title: e.target.value })}
                placeholder="Page title..."
              />
              <span style={styles.pill}>{formatDateTime(activeEntry.createdAt)}</span>
              {isRecording && <span style={styles.pill}>Recording...</span>}
            </div>

            <textarea
              style={styles.textarea}
              value={editorValue}
              onChange={(e) => updateActive({ text: e.target.value })}
              placeholder="Your thoughts will appear here..."
            />
          </>
        )}
      </main>
    </div>
  );
}
