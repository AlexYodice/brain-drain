import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useBackpacks } from "../BackpackContext";
import Icon from "../Icon";
import { formatLongDate } from "../storage";
import { TRANSCRIBE_LANGUAGES, useDictation } from "../useDictation";
import { IconButton, LockedGate, Sheet, SheetItem, TextButton, TopBar } from "../ui";

const BULLET = "• ";

// Adds a bullet to the start of the caret's line (or removes it if already there).
function toggleBulletAt(text, caret) {
  const lineStart = text.lastIndexOf("\n", caret - 1) + 1;
  if (text.startsWith(BULLET, lineStart)) {
    return { text: text.slice(0, lineStart) + text.slice(lineStart + BULLET.length), caret: caret - BULLET.length };
  }
  return { text: text.slice(0, lineStart) + BULLET + text.slice(lineStart), caret: caret + BULLET.length };
}

function withInterim(text, interim, lyricsLineBreaks) {
  if (!interim) return text;
  if (lyricsLineBreaks) return `${text}${text.endsWith("\n") || !text ? "" : "\n"}${interim}`;
  return `${text}${text && !text.endsWith(" ") && !text.endsWith("\n") ? " " : ""}${interim}`;
}

// Route: /note/new?backpack=<id>[&voice=1] creates; /note/:id edits (autosaves).
export default function NoteScreen() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { backpacks, getBackpack, getNote, createNote, updateNote, appendToNote, deleteNote, isOpenable, unlockForSession } =
    useBackpacks();

  const existing = id ? getNote(id) : null;
  const isNew = !id;
  const [draft, setDraft] = useState(() => {
    const requested = params.get("backpack");
    return {
      title: "",
      text: "",
      redaction: false,
      backpackId: backpacks.some((b) => b.id === requested) ? requested : null,
    };
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef(null);

  const note = isNew ? draft : existing;
  const backpackId = isNew ? draft.backpackId : existing?.notebookId;
  const backpack = getBackpack(backpackId);

  // useDictation keeps the latest callback in a ref, so this needn't be memoized.
  const dictation = useDictation((chunk) => {
    if (isNew) setDraft((d) => ({ ...d, text: `${d.text}${chunk}`.replace(/\n{3,}/g, "\n\n") }));
    else appendToNote(id, chunk);
  });
  const { start: startDictation } = dictation;

  // Voice shortcut from Home: try to start listening right away. Browsers that
  // require a tap first (iOS Safari) just stay idle until the mic is tapped.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (isNew && params.get("voice") === "1" && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startDictation();
    }
  }, [isNew, params, startDictation]);

  if (!isNew && !existing) {
    return (
      <div className="bp-screen">
        <TopBar left={<IconButton icon="back" label="Back" onClick={() => navigate("/")} />} />
        <p className="bp-empty-title">That note doesn&apos;t exist anymore.</p>
      </div>
    );
  }

  if (!isNew && backpack && !isOpenable(backpack)) {
    return (
      <div className="bp-screen">
        <TopBar left={<IconButton icon="back" label="Back" onClick={() => navigate(-1)} />} />
        <LockedGate backpack={backpack} onUnlock={() => unlockForSession(backpack)} />
      </div>
    );
  }

  function patch(fields) {
    if (isNew) setDraft((d) => ({ ...d, ...fields }));
    else updateNote(existing.id, fields);
  }

  const canSave = isNew && Boolean(draft.backpackId) && (draft.text.trim() || draft.title.trim());

  function handleSave() {
    if (!canSave) return;
    dictation.stop();
    createNote({ backpackId: draft.backpackId, title: draft.title, text: draft.text, redaction: draft.redaction });
    navigate(`/b/${draft.backpackId}`, { replace: true });
  }

  function handleBullet() {
    const el = textareaRef.current;
    if (!el || dictation.isRecording) return;
    const next = toggleBulletAt(note.text ?? "", el.selectionStart ?? 0);
    patch({ text: next.text });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    });
  }

  function handleDelete() {
    setMenuOpen(false);
    if (!confirm("Delete this note?")) return;
    dictation.stop();
    deleteNote(existing.id);
    navigate(-1);
  }

  const editorValue = withInterim(note.text ?? "", dictation.interim, dictation.lyricsLineBreaks);

  return (
    <div className="bp-screen bp-note">
      {isNew ? (
        <TopBar
          left={<TextButton onClick={() => navigate(-1)}>Cancel</TextButton>}
          title="New Note"
          right={
            <TextButton variant="pill" onClick={handleSave} disabled={!canSave}>
              Save
            </TextButton>
          }
        />
      ) : (
        <TopBar
          left={<IconButton icon="back" label="Back" onClick={() => navigate(-1)} />}
          right={
            <>
              <IconButton
                icon="pin"
                label={existing.pinned ? "Unpin" : "Pin"}
                active={existing.pinned}
                onClick={() => updateNote(existing.id, { pinned: !existing.pinned })}
              />
              <IconButton icon="dots" label="Note options" onClick={() => setMenuOpen(true)} />
            </>
          }
        />
      )}

      {isNew ? (
        <>
          <input
            className="bp-input"
            placeholder="Title (optional)"
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
          <label className="bp-select">
            {backpack ? (
              <span className="bp-mini-circle" style={{ "--bp-color": backpack.color }}>
                <Icon name={backpack.icon} size={14} strokeWidth={2} />
              </span>
            ) : null}
            <select
              value={draft.backpackId ?? ""}
              onChange={(e) => patch({ backpackId: e.target.value })}
              aria-label="Backpack"
            >
              {!draft.backpackId ? <option value="">Choose a backpack</option> : null}
              {backpacks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={18} />
          </label>
        </>
      ) : (
        <div className="bp-note-head">
          <input
            className="bp-note-title"
            value={existing.title}
            placeholder="Untitled"
            onChange={(e) => patch({ title: e.target.value })}
            aria-label="Title"
          />
          <div className="bp-note-meta">
            <span>{formatLongDate(existing.createdAt)}</span>
            {backpack ? (
              <span className="bp-chip" style={{ "--bp-color": backpack.color }}>
                <Icon name={backpack.icon} size={12} strokeWidth={2.2} />
                {backpack.name}
              </span>
            ) : null}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="bp-editor"
        placeholder="Start writing..."
        value={editorValue}
        onChange={(e) => patch({ text: e.target.value })}
        readOnly={dictation.isRecording}
        aria-label="Note text"
      />

      {dictation.isRecording ? <p className="bp-listening">Listening… tap the mic to stop.</p> : null}

      <div className="bp-redaction">
        <button
          type="button"
          className={`bp-toggle${note.redaction ? " is-on" : ""}`}
          role="switch"
          aria-checked={Boolean(note.redaction)}
          onClick={() => patch({ redaction: !note.redaction })}
        >
          <span className="bp-toggle-track">
            <span className="bp-toggle-thumb" />
          </span>
          Redaction {note.redaction ? "ON" : "OFF"}
        </button>
        {note.redaction ? <span className="bp-redaction-note">Engine not built yet — this only flags the note.</span> : null}
      </div>

      <div className="bp-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" className="bp-tool" disabled title="Text styles — coming soon" aria-label="Text styles (coming soon)">
          Aa
        </button>
        <IconButton icon="list" label="Bullet list" onClick={handleBullet} disabled={dictation.isRecording} />
        <IconButton icon="image" label="Add image (coming soon)" disabled />
        <IconButton
          icon="mic"
          label={dictation.isRecording ? "Stop voice input" : "Voice input"}
          onClick={dictation.isRecording ? dictation.stop : dictation.start}
          disabled={!dictation.canUseSpeech}
          active={dictation.isRecording}
        />
      </div>

      {!isNew ? (
        <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Note">
          <VoiceSettings dictation={dictation} />
          <SheetItem icon="trash" danger onClick={handleDelete}>
            Delete note
          </SheetItem>
        </Sheet>
      ) : null}
      {isNew ? <VoiceSettingsInline dictation={dictation} /> : null}
    </div>
  );
}

function VoiceSettings({ dictation }) {
  return (
    <div className="bp-voice-settings">
      <label className="bp-field bp-field-compact">
        <span>Voice language</span>
        <select value={dictation.language} onChange={(e) => dictation.setLanguage(e.target.value)}>
          {TRANSCRIBE_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="bp-checkbox">
        <input
          type="checkbox"
          checked={dictation.lyricsLineBreaks}
          onChange={(e) => dictation.setLyricsLineBreaks(e.target.checked)}
        />
        <span>Lyrics mode — say &ldquo;new line&rdquo; or pause to break lines</span>
      </label>
    </div>
  );
}

function VoiceSettingsInline({ dictation }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bp-voice-inline">
      <button type="button" className="bp-link" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Voice settings
      </button>
      {open ? <VoiceSettings dictation={dictation} /> : null}
    </div>
  );
}
