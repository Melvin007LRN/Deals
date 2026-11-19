import { Suspense, lazy, useState } from "react";
import { useGame } from "./game/store.ts";
import { LocalGame } from "./game/local.ts";
import GameUI, { Rules } from "./ui/GameUI.tsx";
import { onlineAvailable } from "./game/online.ts";
import OnlineLobby from "./ui/OnlineLobby.tsx";

const Board3D = lazy(() => import("./scene/Board3D.tsx"));

function loadName(): string {
  try {
    return localStorage.getItem("deals.name") ?? "";
  } catch {
    return "";
  }
}

export default function App() {
  const ctrl = useGame((s) => s.ctrl);
  const attach = useGame((s) => s.attach);
  const detach = useGame((s) => s.detach);
  const [name, setName] = useState(loadName());
  const [bots, setBots] = useState(2);
  const [screen, setScreen] = useState<"home" | "online">("home");
  const pseudo = name.trim() || "Joueur";
  const saveName = () => {
    try {
      localStorage.setItem("deals.name", pseudo);
    } catch {
      /* stockage indisponible */
    }
  };

  if (ctrl)
    return (
      <div className="game">
        <Suspense fallback={<div className="loading">Construction de la ville…</div>}>
          <Board3D />
        </Suspense>
        <GameUI onQuit={() => detach()} />
      </div>
    );

  if (screen === "online") return <OnlineLobby name={pseudo} onBack={() => setScreen("home")} />;

  return (
    <div className="home">
      <div className="home-bg" />
      <div className="home-card">
        <div className="logo">DEALS</div>
        <p className="tagline">Achète. Négocie. Construis. Domine la ville.</p>
        <label className="field">
          <span>Ton pseudo</span>
          <input value={name} maxLength={16} placeholder="Joueur" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field">
          <span>Adversaires (bots)</span>
          <div className="seg">
            {[2, 3].map((n) => (
              <button key={n} className={bots === n ? "on" : ""} onClick={() => setBots(n)}>
                {n} bots ({n + 1} joueurs)
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn gold wide big"
          onClick={() => {
            saveName();
            attach(new LocalGame(pseudo, bots));
          }}
        >
          Jouer contre les bots
        </button>
        <button
          className="btn ghost wide"
          disabled={!onlineAvailable()}
          onClick={() => {
            saveName();
            setScreen("online");
          }}
        >
          Partie en ligne entre amis {onlineAvailable() ? "" : "(bientôt)"}
        </button>
        <Rules />
        <p className="version">Version de test · règles 1.4</p>
      </div>
    </div>
  );
}
