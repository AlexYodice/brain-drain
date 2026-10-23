import Icon from "./Icon";

export function BackpackCircle({ backpack, size = "md", onClick, showLabel = true }) {
  return (
    <button
      type="button"
      className={`bp-circle bp-circle-${size}`}
      style={{ "--bp-color": backpack.color }}
      onClick={onClick}
      aria-label={backpack.isLocked ? `${backpack.name} (locked)` : backpack.name}
    >
      <Icon name={backpack.icon} size={size === "lg" ? 38 : size === "sm" ? 18 : 30} strokeWidth={1.7} />
      {showLabel ? <span className="bp-circle-label">{backpack.name}</span> : null}
      {backpack.isLocked ? (
        <span className="bp-circle-lock">
          <Icon name="lock" size={12} strokeWidth={2.2} />
        </span>
      ) : null}
    </button>
  );
}

export function IconButton({ icon, label, onClick, variant = "ghost", disabled, active, size = 22 }) {
  return (
    <button
      type="button"
      className={`bp-icon-btn bp-icon-btn-${variant}${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function TopBar({ left, title, right }) {
  return (
    <header className="bp-topbar">
      <div className="bp-topbar-side">{left}</div>
      {title ? <h1 className="bp-topbar-title">{title}</h1> : <span />}
      <div className="bp-topbar-side bp-topbar-side-right">{right}</div>
    </header>
  );
}

export function TextButton({ children, onClick, variant = "plain", disabled, type = "button" }) {
  return (
    <button type={type} className={`bp-text-btn bp-text-btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Bottom sheet for menus. Tapping the backdrop closes it.
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="bp-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="bp-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="bp-sheet-grabber" />
        {title ? <p className="bp-sheet-title">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function SheetItem({ icon, children, onClick, danger }) {
  return (
    <button type="button" className={`bp-sheet-item${danger ? " is-danger" : ""}`} onClick={onClick}>
      {icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function LockedGate({ backpack, onUnlock }) {
  return (
    <div className="bp-empty">
      <BackpackCircle backpack={backpack} size="lg" showLabel={false} onClick={onUnlock} />
      <p className="bp-empty-title">{backpack.name} is locked</p>
      <TextButton variant="pill" onClick={onUnlock}>
        Unlock
      </TextButton>
    </div>
  );
}
