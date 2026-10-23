import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBackpacks } from "../BackpackContext";
import Icon from "../Icon";
import { BackpackCircle, IconButton, TextButton, TopBar } from "../ui";

export default function ChooseBackpackScreen() {
  const { backpacks, homeIds } = useBackpacks();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const pickingForNote = params.get("for") === "note";
  const withVoice = params.get("voice") === "1";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...backpacks].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return q ? sorted.filter((b) => b.name.toLowerCase().includes(q)) : sorted;
  }, [backpacks, query]);

  function handlePick(backpack) {
    if (pickingForNote) {
      navigate(`/note/new?backpack=${backpack.id}${withVoice ? "&voice=1" : ""}`, { replace: true });
    } else {
      navigate(`/b/${backpack.id}`);
    }
  }

  return (
    <div className="bp-screen">
      <TopBar
        left={<IconButton icon="close" label="Close" onClick={() => navigate("/")} />}
        title={pickingForNote ? "Choose Backpack" : "Backpacks"}
        right={<IconButton icon="plus" label="New backpack" onClick={() => navigate("/backpacks/new")} />}
      />

      {pickingForNote ? <p className="bp-caption">Select where your new note goes.</p> : null}

      <label className="bp-search">
        <Icon name="search" size={18} />
        <input
          type="search"
          placeholder="Search backpacks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="bp-grid">
        {visible.map((b) => (
          <BackpackCircle key={b.id} backpack={b} onClick={() => handlePick(b)} />
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="bp-empty">
          <p className="bp-empty-title">{query ? "No backpacks match." : "No backpacks yet."}</p>
          <TextButton variant="pill" onClick={() => navigate("/backpacks/new")}>
            Create a backpack
          </TextButton>
        </div>
      ) : null}

      <div className="bp-bottom-action">
        <TextButton variant="wide" onClick={() => navigate("/home/manage")}>
          Manage Home ({homeIds.length})
        </TextButton>
      </div>
    </div>
  );
}
