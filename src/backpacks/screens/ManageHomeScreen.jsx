import { useNavigate } from "react-router-dom";
import { useBackpacks } from "../BackpackContext";
import Icon from "../Icon";
import { HOME_LIMIT } from "../storage";
import { IconButton, TopBar } from "../ui";

export default function ManageHomeScreen() {
  const { backpacks, homeIds, toggleHome } = useBackpacks();
  const navigate = useNavigate();
  const isFull = homeIds.length >= HOME_LIMIT;
  const sorted = [...backpacks].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="bp-screen">
      <TopBar
        left={<IconButton icon="back" label="Back" onClick={() => navigate(-1)} />}
        title={`Manage Home (${homeIds.length})`}
        right={null}
      />
      <p className="bp-caption">
        Select up to {HOME_LIMIT} backpacks to show on your home screen.
        {isFull ? " Unselect one to pick another." : ""}
      </p>

      <ul className="bp-list bp-list-plain">
        {sorted.map((b) => {
          const selected = homeIds.includes(b.id);
          const disabled = !selected && isFull;
          return (
            <li key={b.id}>
              <button
                type="button"
                className="bp-check-row"
                onClick={() => toggleHome(b.id)}
                disabled={disabled}
                aria-pressed={selected}
              >
                <span className="bp-mini-circle" style={{ "--bp-color": b.color }}>
                  <Icon name={b.icon} size={16} strokeWidth={2} />
                </span>
                <span className="bp-check-row-name">{b.name}</span>
                <span className={`bp-check${selected ? " is-checked" : ""}`}>
                  {selected ? <Icon name="check" size={15} strokeWidth={3} /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
