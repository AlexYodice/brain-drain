import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBackpacks } from "../BackpackContext";
import Icon from "../Icon";
import { BackpackCircle, IconButton, Sheet, SheetItem, TextButton } from "../ui";

export default function HomeScreen() {
  const { homeBackpacks, user, onLogout, unreadable } = useBackpacks();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const today = new Date();

  return (
    <div className="bp-screen bp-home">
      <div className="bp-home-top">
        <IconButton icon="settings" label="Settings" onClick={() => setSheet("settings")} />
      </div>

      <h1 className="bp-home-date">
        {today.toLocaleDateString("en-US", { weekday: "long" })}
        <br />
        {today.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
      </h1>

      {unreadable ? (
        <p className="bp-warning">
          Your saved notes couldn&apos;t be read, so nothing will be saved this session to avoid overwriting them.
        </p>
      ) : null}

      <div className={`bp-home-cluster bp-home-cluster-${homeBackpacks.length}`}>
        {homeBackpacks.map((b) => (
          <BackpackCircle key={b.id} backpack={b} size="lg" onClick={() => navigate(`/b/${b.id}`)} />
        ))}
        {homeBackpacks.length === 0 ? (
          <div className="bp-empty">
            <p className="bp-empty-title">No backpacks on Home</p>
            <TextButton variant="pill" onClick={() => navigate("/home/manage")}>
              Choose up to 3
            </TextButton>
          </div>
        ) : null}
      </div>

      <nav className="bp-home-dock" aria-label="Quick actions">
        <IconButton icon="waveform" label="Voice note" onClick={() => navigate("/backpacks?for=note&voice=1")} />
        <button
          type="button"
          className="bp-fab"
          aria-label="New note"
          onClick={() => navigate("/backpacks?for=note")}
        >
          <Icon name="plus" size={30} strokeWidth={2} />
        </button>
        <IconButton icon="user" label="Account" onClick={() => setSheet("account")} />
      </nav>

      <Sheet open={sheet === "settings"} onClose={() => setSheet(null)} title="Settings">
        <SheetItem icon="grid" onClick={() => navigate("/backpacks")}>
          All backpacks
        </SheetItem>
        <SheetItem icon="home" onClick={() => navigate("/home/manage")}>
          Manage Home
        </SheetItem>
      </Sheet>

      <Sheet open={sheet === "account"} onClose={() => setSheet(null)} title={user?.email || "Account"}>
        <SheetItem icon="logout" onClick={onLogout}>
          Sign out
        </SheetItem>
      </Sheet>
    </div>
  );
}
