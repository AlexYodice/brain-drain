import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBackpacks } from "../BackpackContext";
import Icon from "../Icon";
import { BACKPACK_COLORS, BACKPACK_ICONS } from "../storage";
import { TextButton, TopBar } from "../ui";

// Used for both "New Backpack" and editing an existing one.
export default function BackpackFormScreen() {
  const { id } = useParams();
  const { getBackpack, createBackpack, updateBackpack } = useBackpacks();
  const navigate = useNavigate();
  const existing = id ? getBackpack(id) : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [icon, setIcon] = useState(existing?.icon ?? null);
  const [color, setColor] = useState(existing?.color ?? BACKPACK_COLORS[0]);
  const [pickingIcon, setPickingIcon] = useState(false);
  const canSave = name.trim().length > 0;

  if (id && !existing) {
    return (
      <div className="bp-screen">
        <p className="bp-empty-title">That backpack doesn&apos;t exist.</p>
      </div>
    );
  }

  function handleSave() {
    if (!canSave) return;
    const fields = { name: name.trim(), description: description.trim(), icon: icon ?? "backpack", color };
    if (existing) {
      updateBackpack(existing.id, fields);
    } else {
      createBackpack(fields);
    }
    navigate(-1);
  }

  return (
    <div className="bp-screen">
      <TopBar
        left={<TextButton onClick={() => navigate(-1)}>Cancel</TextButton>}
        title={existing ? "Edit Backpack" : "New Backpack"}
        right={
          <TextButton variant="pill" onClick={handleSave} disabled={!canSave}>
            {existing ? "Save" : "Create"}
          </TextButton>
        }
      />

      <button
        type="button"
        className={`bp-icon-picker${icon ? " has-icon" : ""}`}
        style={icon ? { "--bp-color": color } : undefined}
        onClick={() => setPickingIcon((v) => !v)}
        aria-expanded={pickingIcon}
      >
        <Icon name={icon ?? "image"} size={icon ? 40 : 26} />
        {icon ? null : <span>Add Icon</span>}
      </button>

      {pickingIcon ? (
        <div className="bp-icon-grid" role="listbox" aria-label="Icon">
          {BACKPACK_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={icon === name}
              aria-label={name}
              className={`bp-icon-option${icon === name ? " is-selected" : ""}`}
              onClick={() => {
                setIcon(name);
                setPickingIcon(false);
              }}
            >
              <Icon name={name} size={22} />
            </button>
          ))}
        </div>
      ) : null}

      <div className="bp-field-group">
        <label className="bp-field">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. School, Art, Work..."
            maxLength={40}
            autoFocus={!existing}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </label>
        <label className="bp-field">
          <span>Description (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Classes, notes, research"
            maxLength={60}
          />
        </label>
      </div>

      <p className="bp-section-label">Color</p>
      <div className="bp-swatches" role="radiogroup" aria-label="Color">
        {BACKPACK_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={`Color ${c}`}
            className={`bp-swatch${color === c ? " is-selected" : ""}`}
            style={{ "--bp-color": c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
    </div>
  );
}
