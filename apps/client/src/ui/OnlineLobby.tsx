import { useEffect, useState } from "react";
import { useGame } from "../game/store.ts";
import { OnlineGame, api, loadSession, saveSession, subscribe, type LobbyState, type Session } from "../game/online.ts";

/** Salon en ligne : créer, rejoindre par code, attendre les amis, lancer. */
export default function OnlineLobby({ name, onBack }: { name: string; onBack: () => void }) {
  const attach = useGame((s) => s.attach);
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get("code")?.toUpperCase() ?? "");
  const [max, setMax] = useState(4);
  const [bots, setBots] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // entrée dans une partie déjà lancée (ou reprise après fermeture de l'onglet)
  const enter = async (s: Session) => {
    const st = await api<any>({ action: "state", code: s.code, token: s.token });
    if (st.kind === "lobby") {
      setLobby({ room: st.room, seats: st.seats });
      return;
    }
    if (st.view.phase === "FINISHED") {
      saveSession(null);
      setSession(null);
      setErr("Cette partie est terminée.");
      return;
    }
    attach(new OnlineGame(s, { view: st.view, seats: st.seats, version: st.version, serverNow: st.serverNow }));
  };

  useEffect(() => {
    if (!session) return;
    let alive = true;
    enter(session).catch((e) => {
      if (!alive) return;
      saveSession(null);
      setSession(null);
      setErr(e.message);
    });
    const unsub = subscribe(session, (p) => {
      if (p.kind === "lobby") setLobby({ room: p.room, seats: p.seats });
      if (p.kind === "game") void enter(session);
    });
    // filet de sécurité si une diffusion est manquée
    const poll = setInterval(() => void enter(session).catch(() => {}), 4000);
    return () => {
      alive = false;
      unsub();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const create = () =>
    run(async () => {
      const s = await api<Session>({ action: "create", name, maxPlayers: max, fillBots: bots });
      saveSession(s);
      setSession(s);
    });
  const join = () =>
    run(async () => {
      const s = await api<Session>({ action: "join", code: code.trim().toUpperCase(), name });
      saveSession(s);
      setSession(s);
    });
  const start = () =>
    run(async () => {
      await api({ action: "start", code: session!.code, token: session!.token });
    });
  const leave = () => {
    saveSession(null);
    setSession(null);
    setLobby(null);
  };
  const link = session ? `${location.origin}/?code=${session.code}` : "";
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "DEALS", text: `Rejoins ma partie DEALS : code ${session!.code}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setErr("Lien copié !");
      }
    } catch {
      /* partage annulé */
    }
  };

  return (
    <div className="home">
      <div className="home-bg" />
      <div className="home-card">
        <div className="logo small-logo">DEALS</div>
        {!session && (
          <>
            <h3>Créer une partie</h3>
            <div className="seg">
              {[3, 4].map((n) => (
                <button key={n} className={max === n ? "on" : ""} onClick={() => setMax(n)}>
                  {n} joueurs
                </button>
              ))}
            </div>
            <label className="toggle">
              <input type="checkbox" checked={bots} onChange={(e) => setBots(e.target.checked)} /> Compléter avec des bots au lancement
            </label>
            <button className="btn gold wide" disabled={busy} onClick={create}>
              Créer et inviter
            </button>
            <h3 style={{ marginTop: 22 }}>Rejoindre</h3>
            <label className="field">
              <span>Code de la partie</span>
              <input value={code} maxLength={5} placeholder="ABCDE" onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ letterSpacing: "0.3em", textTransform: "uppercase" }} />
            </label>
            <button className="btn ghost wide" disabled={busy || code.trim().length !== 5} onClick={join}>
              Rejoindre
            </button>
          </>
        )}
        {session && lobby && (
          <>
            <p className="muted small">Code de la partie</p>
            <div className="room-code">{lobby.room.code}</div>
            <button className="btn ghost wide" onClick={share}>
              Partager l'invitation
            </button>
            <h3>
              Joueurs ({lobby.seats.length}/{lobby.room.maxPlayers})
            </h3>
            <ul className="seat-list">
              {lobby.seats.map((s) => (
                <li key={s.id}>
                  <i className="dot" style={{ background: s.color }} /> {s.name}
                  {s.id === lobby.room.host ? <span className="tag">hôte</span> : null}
                  {s.id === session.playerId ? <span className="tag">toi</span> : null}
                </li>
              ))}
            </ul>
            {lobby.room.host === session.playerId ? (
              <button className="btn gold wide big" disabled={busy || (lobby.seats.length < 3 && !lobby.room.fillBots)} onClick={start}>
                Lancer la partie
              </button>
            ) : (
              <p className="muted">En attente du lancement par l'hôte…</p>
            )}
            <p className="muted tiny">{lobby.room.fillBots ? "Les places libres seront prises par des bots." : "Il faut au moins 3 joueurs."}</p>
            <button className="btn ghost wide" onClick={leave}>
              Quitter le salon
            </button>
          </>
        )}
        {session && !lobby && <p className="muted">Connexion…</p>}
        {err && <p className={err.includes("copié") ? "good" : "error-text"}>{err}</p>}
        <button className="btn ghost wide" onClick={onBack}>
          Retour
        </button>
      </div>
    </div>
  );
}
