import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBackpacks } from "../BackpackContext";
import Icon from "../Icon";
import { formatShortDate } from "../storage";
import { BackpackCircle, IconButton, LockedGate, Sheet, SheetItem, TopBar } from "../ui";

export default function BackpackScreen() {
  const { id } = useParams();
  const { getBackpack, notesIn, isOpenable, unlockForSession, lockBackpack, removeLock, deleteBackpack } =
    useBackpacks();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const backpack = getBackpack(id);

  const notes = useMemo(
    () =>
      [...notesIn(id)].sort(
        (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt) - new Date(a.updatedAt)
      ),
    [notesIn, id]
  );

  if (!backpack) {
    return (
      <div className="bp-screen">
        <TopBar left={<IconButton icon="back" label="Back" onClick={() => navigate("/")} />} />
        <p className="bp-empty-title">That backpack doesn&apos;t exist anymore.</p>
      </div>
    );
  }

  const openable = isOpenable(backpack);

  function handleDelete() {
    setMenuOpen(false);
    const count = notes.length;
    const detail = count ? ` and its ${count} note${count === 1 ? "" : "s"}` : "";
    if (!confirm(`Delete "${backpack.name}"${detail}? This cannot be undone.`)) return;
    deleteBackpack(backpack.id);
    navigate("/", { replace: true });
  }

  return (
    <div className="bp-screen">
      <TopBar
        left={<IconButton icon="back" label="Back" onClick={() => navigate(-1)} />}
        right={
          <>
            {openable ? (
              <IconButton icon="dots" label="Backpack options" onClick={() => setMenuOpen(true)} />
            ) : null}
            {openable ? (
              <IconButton
                icon="plus"
                label="New note"
                variant="filled"
                onClick={() => navigate(`/note/new?backpack=${backpack.id}`)}
              />
            ) : null}
          </>
        }
      />

      {!openable ? (
        <LockedGate backpack={backpack} onUnlock={() => unlockForSession(backpack)} />
      ) : (
        <>
          <div className="bp-hero">
            <BackpackCircle backpack={backpack} size="hero" showLabel={false} />
            <h1 className="bp-hero-title">{backpack.name}</h1>
            {backpack.description ? <p className="bp-hero-subtitle">{backpack.description}</p> : null}
          </div>

          {notes.length === 0 ? (
            <div className="bp-empty">
              <p className="bp-empty-title">No notes yet</p>
              <p className="bp-caption">Tap + to add one.</p>
            </div>
          ) : (
            <ul className="bp-list">
              {notes.map((n) => (
                <li key={n.id}>
                  <button type="button" className="bp-note-row" onClick={() => navigate(`/note/${n.id}`)}>
                    <span className="bp-note-row-text">
                      <span className="bp-note-row-title">{n.title || "Untitled"}</span>
                      <span className="bp-note-row-date">{formatShortDate(n.updatedAt)}</span>
                    </span>
                    {n.pinned ? <Icon name="pin" size={16} className="bp-note-row-pin" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={backpack.name}>
        <SheetItem icon="pen" onClick={() => navigate(`/b/${backpack.id}/edit`)}>
          Edit backpack
        </SheetItem>
        <SheetItem
          icon="lock"
          onClick={() => {
            setMenuOpen(false);
            if (backpack.isLocked) removeLock(backpack);
            else lockBackpack(backpack);
          }}
        >
          {backpack.isLocked ? "Remove lock" : "Lock with password"}
        </SheetItem>
        <SheetItem icon="trash" danger onClick={handleDelete}>
          Delete backpack
        </SheetItem>
      </Sheet>
    </div>
  );
}
