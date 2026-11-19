import { useEffect, useMemo, useState } from "react";
import {
  BOARD,
  DISTRICTS,
  PROPERTY_INDICES,
  RULES,
  buildCost,
  canBuild,
  canBuy,
  canPlayCard,
  computeRent,
  controls,
  minBid,
  mortgageValue,
  ownedCount,
  priceOf,
  redeemValue,
  resourceChoices,
  type Bundle,
  type Command,
  type PlayerView,
} from "@deals/engine";
import { useGame } from "../game/store.ts";
import { objectiveText } from "../game/describe.ts";
import { GameCard } from "./Card.tsx";
import { asState, cardInfo, spaceName } from "./helpers.ts";

const districtColor = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.color])) as Record<string, string>;
const districtName = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.name])) as Record<string, string>;

function useNow(ms = 250) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

function useSend() {
  const ctrl = useGame((s) => s.ctrl);
  const notify = useGame((s) => s.notify);
  return async (cmd: Command) => {
    if (!ctrl) return false;
    const err = await ctrl.send(cmd);
    if (err) {
      notify(err, "error");
      return false;
    }
    return true;
  };
}

/** Attend la fin des animations avant d'afficher la prochaine décision. */
function useAnimDone() {
  useNow(150);
  return performance.now() >= useGame.getState().busyUntil;
}

/* ------------------------------------------------------------------ */

function Res({ kind, n }: { kind: "D" | "M" | "E"; n: number }) {
  return <span className={`res-chip ${kind}`}>{n}</span>;
}

function PlayersBar({ view }: { view: PlayerView }) {
  const seats = useGame((s) => s.seats);
  const me = useGame((s) => s.ctrl?.me);
  const active = view.turnOrder[view.activeIndex];
  return (
    <div className="players">
      {view.turnOrder.map((id) => {
        const p = view.players[id]!;
        const seat = seats.find((x) => x.id === id);
        return (
          <div key={id} className={`pchip ${id === active ? "active" : ""} ${id === me ? "me" : ""}`} style={{ borderColor: seat?.color }}>
            <div className="pchip-top">
              <i className="dot" style={{ background: seat?.color }} />
              <b>{id === me ? "Toi" : p.name}</b>
              {!seat?.connected && <span className="tag warn">!</span>}
            </div>
            <div className="pchip-res">
              <span className="r-d">{p.credits}</span>
              <span className="r-m">{p.materials}</span>
              <span className="r-e">{p.energy}</span>
              <span className="r-c">{view.handCounts[id]}</span>
            </div>
            {p.debt > 0 && <div className="debt">dette {p.debt}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PropertySheet({ view, index, onClose }: { view: PlayerView; index: number; onClose: () => void }) {
  const s = BOARD[index]!;
  const seats = useGame((st) => st.seats);
  if (s.type !== "property") {
    const info: Record<string, string> = {
      start: `Chaque passage ou arrêt : +${view.config.startReward} D${view.config.drawOnStart ? " et 1 carte Chance" : ""}.`,
      chance: "Pioche 2 cartes, garde-en 1 (main maximum 5).",
      market: `Achat Matériau ${RULES.marketBuyMaterial} D · Énergie ${RULES.marketBuyEnergy} D · vente ${RULES.marketSell} D (3 opérations max).`,
      event: "Actualité économique (sans effet dans cette version de test).",
      tax: `Taxe municipale : ${RULES.taxAmount} D.`,
    };
    return (
      <Sheet title={s.name} onClose={onClose}>
        <p className="muted">{info[s.type]}</p>
      </Sheet>
    );
  }
  const pr = view.properties[index]!;
  const st = asState(view);
  const owner = pr.ownerId ? seats.find((x) => x.id === pr.ownerId) : null;
  const rent = computeRent(st, index);
  const d = s.district!;
  return (
    <Sheet title={s.name} onClose={onClose} accent={districtColor[d]}>
      <div className="kv">
        <span>Quartier</span>
        <b style={{ color: districtColor[d] }}>{districtName[d]}</b>
        <span>Prix</span>
        <b>{s.price} D</b>
        <span>Propriétaire</span>
        <b style={{ color: owner?.color }}>{owner ? owner.name : "Libre"}</b>
        <span>Niveau</span>
        <b>{pr.level} / 3</b>
        <span>Loyer actuel</span>
        <b>{pr.mortgaged ? "aucun (hypothéquée)" : `${rent.total} D`}</b>
        <span>Hypothèque / levée</span>
        <b>
          {mortgageValue(index)} D / {redeemValue(index)} D
        </b>
      </div>
      <p className="muted small">Majorité du quartier (2 propriétés sur 3) requise pour construire. Loyer : ×1,5 / ×2 / ×3 selon le niveau, +10 % si le quartier est contrôlé.</p>
    </Sheet>
  );
}

export function Sheet({ title, children, onClose, accent }: { title: string; children: React.ReactNode; onClose?: () => void; accent?: string }) {
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={accent ? { borderTopColor: accent } : undefined} role="dialog" aria-label={title}>
        <div className="sheet-head">
          <h3>{title}</h3>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Fermer">
              ✕
            </button>
          )}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HandSheet({ view, onClose }: { view: PlayerView; onClose: () => void }) {
  const me = useGame((s) => s.ctrl!.me);
  const send = useSend();
  const [sel, setSel] = useState<number | null>(null);
  const p = view.players[me]!;
  const st = asState(view);
  const isMyTurn = view.turnOrder[view.activeIndex] === me;
  const info = sel !== null ? cardInfo(view, view.visibleCards[sel]!) : null;
  const opponents = view.turnOrder.filter((x) => x !== me);
  const base = sel !== null ? ({ type: "PLAY_CARD", playerId: me, instanceId: sel } as const) : null;
  const options: { label: string; cmd: Extract<Command, { type: "PLAY_CARD" }> }[] = [];
  if (base && info) {
    const t = info.target;
    if (t === "none") options.push({ label: "Jouer la carte", cmd: base });
    if (t === "opponent") for (const o of opponents) options.push({ label: view.players[o]!.name, cmd: { ...base, targetPlayerId: o } });
    if (t === "ownProperty" || t === "opponentProperty")
      for (const i of PROPERTY_INDICES) options.push({ label: spaceName(i), cmd: { ...base, propertyIndex: i } });
    if (t === "district") for (const d of DISTRICTS) options.push({ label: d.name, cmd: { ...base, district: d.id } });
    if (t === "resource") options.push({ label: "Vendre 1 Matériau", cmd: { ...base, resource: "materials" } }, { label: "Vendre 1 Énergie", cmd: { ...base, resource: "energy" } });
    if (t === "swap")
      for (const i of PROPERTY_INDICES)
        if (view.properties[i]!.ownerId === me)
          for (const j of PROPERTY_INDICES) if (view.properties[j]!.ownerId && view.properties[j]!.ownerId !== me) options.push({ label: `${spaceName(i)} ⇄ ${spaceName(j)}`, cmd: { ...base, propertyIndex: i, otherPropertyIndex: j } });
  }
  const valid = options.filter((o) => canPlayCard(st, o.cmd) === null);
  const firstErr = options.length && !valid.length ? canPlayCard(st, options[0]!.cmd) : null;
  return (
    <Sheet title={`Ta main (${p.hand.length}/${RULES.maxHand})`} onClose={onClose}>
      {p.hand.length === 0 && <p className="muted">Aucune carte. Arrête-toi sur une case Chance ou passe par Départ pour en piocher.</p>}
      <div className="hand">
        {p.hand.map((inst) => (
          <GameCard key={inst} view={view} cardId={view.visibleCards[inst]!} small selected={sel === inst} onClick={() => setSel(sel === inst ? null : inst)} />
        ))}
      </div>
      {info && (
        <div className="play-zone">
          {!isMyTurn && <p className="muted">Les cartes se jouent pendant ton tour (une par tour).</p>}
          {isMyTurn && view.turn.cardPlayed && <p className="muted">Tu as déjà joué une carte ce tour.</p>}
          {isMyTurn && !view.turn.cardPlayed && valid.length === 0 && <p className="muted">Pas jouable maintenant{firstErr ? ` (${errText(firstErr)})` : ""}.</p>}
          {isMyTurn && valid.length > 0 && (
            <>
              <p className="muted small">{info.target === "none" ? "" : "Choisis la cible :"}</p>
              <div className="chips">
                {valid.map((o, k) => (
                  <button
                    key={k}
                    className="btn gold"
                    onClick={async () => {
                      if (await send(o.cmd)) {
                        setSel(null);
                        onClose();
                      }
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

const ERRORS: Record<string, string> = {
  INSUFFICIENT_RESOURCES: "ressources insuffisantes",
  WRONG_PHASE: "pas à ce moment du tour",
  INVALID_TARGET: "aucune cible valide",
  IN_RECOVERY: "impossible en redressement",
  ALREADY_ACTIVE: "déjà active",
  NOT_CUMULATIVE: "non cumulable",
  ALREADY_ATTACKED_THIS_ROUND: "déjà attaquée cette manche",
  TARGET_MORTGAGED: "cible hypothéquée",
  NO_RESOURCE: "ressource manquante",
  VALUE_MISMATCH: "valeurs trop différentes",
};
const errText = (c: string) => ERRORS[c] ?? c;

/* ------------------------------------------------------------------ */

function BuildSheet({ view, onClose }: { view: PlayerView; onClose: () => void }) {
  const me = useGame((s) => s.ctrl!.me);
  const send = useSend();
  const st = asState(view);
  const mine = PROPERTY_INDICES.filter((i) => view.properties[i]!.ownerId === me);
  const isManage = view.turnOrder[view.activeIndex] === me && (view.phase === "MANAGE" || view.phase === "PRE_ROLL");
  return (
    <Sheet title="Mes propriétés" onClose={onClose}>
      {mine.length === 0 && <p className="muted">Tu ne possèdes encore aucune propriété.</p>}
      <div className="plist">
        {mine.map((i) => {
          const pr = view.properties[i]!;
          const d = BOARD[i]!.district!;
          const err = canBuild(st, me, i);
          const c = pr.level < 3 ? buildCost(st, me, i) : null;
          return (
            <div key={i} className="prow" style={{ borderLeftColor: districtColor[d] }}>
              <div className="prow-main">
                <b>{spaceName(i)}</b>
                <span className="muted small">
                  {districtName[d]} · niveau {pr.level} · loyer {pr.mortgaged ? 0 : computeRent(st, i).total} D {controls(st, me, d) ? "· quartier contrôlé" : `· ${ownedCount(st, me, d)}/3`}
                  {pr.mortgaged ? " · hypothéquée" : ""}
                </span>
              </div>
              <div className="prow-actions">
                {view.phase === "MANAGE" && view.turnOrder[view.activeIndex] === me && c && !pr.mortgaged && (
                  <button className="btn gold sm" disabled={err !== null} onClick={() => send({ type: "BUILD", playerId: me, propertyIndex: i })} title={err ? buildErr(err) : ""}>
                    Construire {c.credits} D · {c.materials}M{c.energy ? ` · ${c.energy}É` : ""}
                  </button>
                )}
                {isManage && pr.level > 0 && (
                  <button className="btn ghost sm" onClick={() => send({ type: "SELL_BUILDING", playerId: me, propertyIndex: i })}>
                    Revendre niv.
                  </button>
                )}
                {isManage && !pr.mortgaged && pr.level === 0 && (
                  <button className="btn ghost sm" onClick={() => send({ type: "MORTGAGE", playerId: me, propertyIndex: i })}>
                    Hypothéquer +{mortgageValue(i)}
                  </button>
                )}
                {isManage && pr.mortgaged && (
                  <button className="btn ghost sm" onClick={() => send({ type: "REDEEM_MORTGAGE", playerId: me, propertyIndex: i })}>
                    Lever −{redeemValue(i)}
                  </button>
                )}
              </div>
              {view.phase === "MANAGE" && err && c && !pr.mortgaged && <span className="muted tiny">{buildErr(err)}</span>}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

const buildErr = (e: string) =>
  ({ NO_MAJORITY: "majorité 2/3 du quartier requise", BUILD_LIMIT: "une construction par tour", INSUFFICIENT_RESOURCES: "ressources insuffisantes", STRIKE: "grève en cours", IN_RECOVERY: "redressement", MAX_LEVEL: "niveau max" } as Record<string, string>)[e] ?? e;

/* ------------------------------------------------------------------ */

const emptyBundle = (): Bundle => ({ credits: 0, materials: 0, energy: 0, properties: [] });

function TradeComposer({ view, onClose }: { view: PlayerView; onClose: () => void }) {
  const me = useGame((s) => s.ctrl!.me);
  const send = useSend();
  const opponents = view.turnOrder.filter((x) => x !== me);
  const [to, setTo] = useState(opponents[0]!);
  const [give, setGive] = useState<Bundle>(emptyBundle());
  const [recv, setRecv] = useState<Bundle>(emptyBundle());
  const p = view.players[me]!;
  const q = view.players[to]!;
  const stepper = (b: Bundle, set: (b: Bundle) => void, k: "credits" | "materials" | "energy", max: number, step: number) => (
    <div className="stepper">
      <button className="icon-btn" onClick={() => set({ ...b, [k]: Math.max(0, b[k] - step) })}>−</button>
      <b>{b[k]}</b>
      <button className="icon-btn" onClick={() => set({ ...b, [k]: Math.min(max, b[k] + step) })}>+</button>
    </div>
  );
  const props = (owner: string, b: Bundle, set: (b: Bundle) => void) => (
    <div className="chips">
      {PROPERTY_INDICES.filter((i) => view.properties[i]!.ownerId === owner && !view.properties[i]!.mortgaged).map((i) => (
        <button key={i} className={`chip ${b.properties.includes(i) ? "on" : ""}`} style={{ borderColor: districtColor[BOARD[i]!.district!] }} onClick={() => set({ ...b, properties: b.properties.includes(i) ? b.properties.filter((x) => x !== i) : [...b.properties, i] })}>
          {spaceName(i)}
        </button>
      ))}
    </div>
  );
  const canPropose = view.phase === "MANAGE" && view.turnOrder[view.activeIndex] === me && view.turn.tradeOffers < RULES.tradeOffersPerTurn;
  return (
    <Sheet title="Proposer un échange" onClose={onClose}>
      {!canPropose && <p className="muted">Les échanges se proposent pendant ton tour, après le déplacement ({RULES.tradeOffersPerTurn} offres max).</p>}
      <div className="chips">
        {opponents.map((o) => (
          <button key={o} className={`chip ${o === to ? "on" : ""}`} onClick={() => { setTo(o); setRecv(emptyBundle()); }}>
            {view.players[o]!.name}
          </button>
        ))}
      </div>
      <div className="trade-cols">
        <div>
          <h4>Tu donnes</h4>
          <label>Crédits {stepper(give, setGive, "credits", p.credits, 5)}</label>
          <label>Matériaux {stepper(give, setGive, "materials", p.materials, 1)}</label>
          <label>Énergie {stepper(give, setGive, "energy", p.energy, 1)}</label>
          {props(me, give, setGive)}
        </div>
        <div>
          <h4>Tu reçois</h4>
          <label>Crédits {stepper(recv, setRecv, "credits", q.credits, 5)}</label>
          <label>Matériaux {stepper(recv, setRecv, "materials", q.materials, 1)}</label>
          <label>Énergie {stepper(recv, setRecv, "energy", q.energy, 1)}</label>
          {props(to, recv, setRecv)}
        </div>
      </div>
      <button
        className="btn gold wide"
        disabled={!canPropose}
        onClick={async () => {
          if (await send({ type: "PROPOSE_TRADE", playerId: me, toId: to, give, receive: recv })) onClose();
        }}
      >
        Envoyer l'offre
      </button>
    </Sheet>
  );
}

function bundleText(b: Bundle) {
  const parts = [b.credits ? `${b.credits} D` : "", b.materials ? `${b.materials} Matériau${b.materials > 1 ? "x" : ""}` : "", b.energy ? `${b.energy} Énergie` : "", ...b.properties.map(spaceName)].filter(Boolean);
  return parts.length ? parts.join(", ") : "rien";
}

/* ------------------------------------------------------------------ */

function AuctionPanel({ view }: { view: PlayerView }) {
  useNow(200);
  const ctrl = useGame((s) => s.ctrl!);
  const me = ctrl.me;
  const send = useSend();
  const a = view.auction!;
  const seats = useGame((s) => s.seats);
  const left = Math.max(0, Math.ceil((a.deadline - ctrl.now()) / 1000));
  const m = minBid(asState(view));
  const active = a.activeBidders.includes(me);
  const highest = a.highestBidderId === me;
  const credits = view.players[me]!.credits;
  const leader = seats.find((x) => x.id === a.highestBidderId);
  const reason = { declined: "Propriété refusée", attack: "Saisie après attaque", forced: "Vente forcée" }[a.reason];
  return (
    <div className="panel auction">
      <div className="auction-head">
        <span className="muted small">{reason}</span>
        <b>{spaceName(a.propertyIndex)}</b>
        <span className={`timer ${left <= 3 ? "hot" : ""}`}>{left}s</span>
      </div>
      <div className="auction-bid">
        {a.currentBid === null ? <span>Départ {a.startPrice} D</span> : <span>Meilleure offre <b>{a.currentBid} D</b> — <b style={{ color: leader?.color }}>{leader?.id === me ? "toi" : leader?.name}</b></span>}
      </div>
      {active && !highest && (
        <div className="chips">
          {[m, m + 5, m + 15].filter((x, k, arr) => x <= credits && arr.indexOf(x) === k).map((x) => (
            <button key={x} className="btn gold" onClick={() => send({ type: "PLACE_BID", playerId: me, amount: x })}>
              {x} D
            </button>
          ))}
          <button className="btn ghost" onClick={() => send({ type: "PASS_AUCTION", playerId: me })}>
            Passer
          </button>
        </div>
      )}
      {highest && <p className="good small">Tu mènes l'enchère. Elle se termine si personne ne surenchérit.</p>}
      {!active && !highest && <p className="muted small">Tu ne participes pas (ou plus) à cette enchère.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ActionPanel({ view }: { view: PlayerView }) {
  const me = useGame((s) => s.ctrl!.me);
  const setSheet = useGame((s) => s.setSheet);
  const send = useSend();
  const done = useAnimDone();
  const st = asState(view);
  const activeId = view.turnOrder[view.activeIndex]!;
  const mine = activeId === me;
  const p = view.players[me]!;
  const activeName = view.players[activeId]!.name;

  if (view.phase === "AUCTION") return done ? <AuctionPanel view={view} /> : null;
  if (view.phase === "TRADE_PENDING" && view.trade) {
    const t = view.trade;
    if (t.toId === me)
      return (
        <div className="panel">
          <b>{view.players[t.fromId]!.name} te propose un échange</b>
          <p className="small">
            Il te donne : <b>{bundleText({ ...t.give, credits: Math.max(0, t.give.credits) })}</b>
            <br />
            Contre : <b>{bundleText(t.receive)}</b>
          </p>
          <div className="chips">
            <button className="btn gold" onClick={() => send({ type: "ACCEPT_TRADE", playerId: me })}>Accepter</button>
            <button className="btn ghost" onClick={() => send({ type: "REJECT_TRADE", playerId: me })}>Refuser</button>
          </div>
        </div>
      );
    return (
      <div className="panel">
        <span className="muted">Offre envoyée à {view.players[t.toId]!.name}… en attente de réponse.</span>
        {t.fromId === me && <button className="btn ghost sm" onClick={() => send({ type: "REJECT_TRADE", playerId: me })}>Annuler</button>}
      </div>
    );
  }
  if (view.phase === "FINISHED") return null;
  if (!mine) return <div className="panel slim"><span className="muted">Tour de <b>{activeName}</b>…</span></div>;
  if (!done) return <div className="panel slim"><span className="muted">…</span></div>;

  switch (view.phase) {
    case "PRE_ROLL":
      return (
        <div className="panel">
          <div className="row">
            <button className="btn gold big" onClick={() => send({ type: "ROLL_DICE", playerId: me })}>🎲 Lancer les dés</button>
          </div>
          <p className="muted tiny">Tu peux jouer une carte avant de lancer (réductions de taxe ou d'achat, protections).</p>
        </div>
      );
    case "RESOURCE_CHOICE": {
      const ch = resourceChoices(st, p);
      return (
        <div className="panel">
          <b>{view.pendingResource?.reason === "cap" ? "Plafond atteint : choisis une autre récompense" : "Dé Choix : choisis ta récompense"}</b>
          <div className="chips">
            {ch.includes("credits") && <button className="btn gold" onClick={() => send({ type: "CHOOSE_RESOURCE", playerId: me, resource: "credits" })}>+5 D</button>}
            {ch.includes("materials") && <button className="btn gold" onClick={() => send({ type: "CHOOSE_RESOURCE", playerId: me, resource: "materials" })}>+1 Matériau</button>}
            {ch.includes("energy") && <button className="btn gold" onClick={() => send({ type: "CHOOSE_RESOURCE", playerId: me, resource: "energy" })}>+1 Énergie</button>}
          </div>
        </div>
      );
    }
    case "BUY_DECISION": {
      const i = p.position;
      const price = Math.max(0, priceOf(i) - view.turn.buyDiscount);
      const err = canBuy(st, me);
      const d = BOARD[i]!.district!;
      return (
        <div className="panel" style={{ borderTopColor: districtColor[d] }}>
          <div className="row between">
            <div>
              <b>{spaceName(i)}</b>
              <div className="muted small">{districtName[d]} · tu en possèdes {ownedCount(st, me, d)}/3</div>
            </div>
            <b className="price">{price} D</b>
          </div>
          <div className="chips">
            <button className="btn gold" disabled={err !== null} onClick={() => send({ type: "BUY_PROPERTY", playerId: me })}>Acheter</button>
            <button className="btn ghost" onClick={() => send({ type: "DECLINE_PROPERTY", playerId: me })}>Refuser → enchère</button>
          </div>
          {err && <p className="muted tiny">{({ RESERVE_REQUIRED: `Il doit te rester ${RULES.voluntaryBuyReserve} D après l'achat.`, BANK_BLOCKED: "Blocage bancaire : tu ne peux pas acheter ce tour (tu peux enchérir).", IN_RECOVERY: "Redressement : pas d'achat." } as Record<string, string>)[err] ?? err}</p>}
        </div>
      );
    }
    case "TAX_DUE": {
      const amount = view.turn.taxCancel ? 0 : Math.max(0, RULES.taxAmount - view.turn.taxReduction);
      return (
        <div className="panel">
          <b>Taxe municipale : {amount} D</b>
          <div className="chips">
            <button className="btn gold" onClick={() => send({ type: "PAY_TAX", playerId: me })}>Payer</button>
            <button className="btn ghost" onClick={() => setSheet("hand")}>Jouer une carte</button>
          </div>
        </div>
      );
    }
    case "CHANCE_CHOICE":
      return <ChanceChoice view={view} />;
    case "MANAGE":
      return (
        <div className="panel">
          <div className="chips">
            <button className="btn ghost" onClick={() => setSheet("build")}>🏗 Construire</button>
            <button className="btn ghost" onClick={() => setSheet("hand")}>🂠 Cartes ({p.hand.length})</button>
            <button className="btn ghost" onClick={() => setSheet("trade")}>🤝 Échanger</button>
            {view.turn.marketAvailable && <button className="btn ghost" onClick={() => setSheet("market")}>⚒ Marché</button>}
          </div>
          <button className="btn gold wide" onClick={() => send({ type: "END_TURN", playerId: me })}>Fin du tour ➜</button>
        </div>
      );
  }
  return null;
}

function ChanceChoice({ view }: { view: PlayerView }) {
  const me = useGame((s) => s.ctrl!.me);
  const send = useSend();
  const [keep, setKeep] = useState<number | null>(null);
  const p = view.players[me]!;
  const full = p.hand.length >= RULES.maxHand;
  return (
    <div className="panel tall">
      <b>Chance : garde une carte</b>
      <div className="hand">
        {view.pendingDraw.map((inst) => (
          <GameCard key={inst} view={view} cardId={view.visibleCards[inst]!} small selected={keep === inst} onClick={() => setKeep(inst)} />
        ))}
      </div>
      {keep !== null && !full && <button className="btn gold wide" onClick={() => send({ type: "CHOOSE_CARD", playerId: me, keep })}>Garder cette carte</button>}
      {keep !== null && full && (
        <>
          <p className="muted small">Main pleine : choisis la carte à défausser.</p>
          <div className="chips">
            {p.hand.map((h) => (
              <button key={h} className="btn ghost sm" onClick={() => send({ type: "CHOOSE_CARD", playerId: me, keep, replace: h })}>
                {cardInfo(view, view.visibleCards[h]!).def.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MarketSheet({ view, onClose }: { view: PlayerView; onClose: () => void }) {
  const me = useGame((s) => s.ctrl!.me);
  const send = useSend();
  const left = RULES.marketMaxTransactions - view.turn.marketTransactions;
  return (
    <Sheet title={`Marché des ressources (${left} opération${left > 1 ? "s" : ""})`} onClose={onClose}>
      <div className="chips">
        <button className="btn gold" disabled={left <= 0} onClick={() => send({ type: "BUY_RESOURCE", playerId: me, resource: "materials" })}>Acheter 1 Matériau · {RULES.marketBuyMaterial} D</button>
        <button className="btn gold" disabled={left <= 0} onClick={() => send({ type: "BUY_RESOURCE", playerId: me, resource: "energy" })}>Acheter 1 Énergie · {RULES.marketBuyEnergy} D</button>
        <button className="btn ghost" disabled={left <= 0} onClick={() => send({ type: "SELL_RESOURCE", playerId: me, resource: "materials" })}>Vendre 1 Matériau · {RULES.marketSell} D</button>
        <button className="btn ghost" disabled={left <= 0} onClick={() => send({ type: "SELL_RESOURCE", playerId: me, resource: "energy" })}>Vendre 1 Énergie · {RULES.marketSell} D</button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

function EndScreen({ view, onQuit }: { view: PlayerView; onQuit: () => void }) {
  const seats = useGame((s) => s.seats);
  const me = useGame((s) => s.ctrl!.me);
  const scores = view.scores ?? [];
  const winner = scores[0];
  const iWon = scores.filter((l) => l.rank === 1).some((l) => l.playerId === me);
  return (
    <div className="end">
      <div className="end-card">
        <div className="crown">👑</div>
        <h2>{iWon ? "Victoire !" : `${view.players[winner?.playerId ?? ""]?.name ?? ""} gagne`}</h2>
        <table className="score">
          <thead>
            <tr>
              <th>#</th><th>Joueur</th><th>Crédits</th><th>Biens</th><th>Bât.</th><th>Quart.</th><th>Obj.</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((l) => {
              const seat = seats.find((x) => x.id === l.playerId);
              return (
                <tr key={l.playerId} className={l.playerId === me ? "me" : ""}>
                  <td>{l.rank}</td>
                  <td style={{ color: seat?.color }}>{l.playerId === me ? "Toi" : seat?.name}</td>
                  <td>{l.credits}</td>
                  <td>{l.properties - l.mortgages}</td>
                  <td>{l.buildings}</td>
                  <td>{l.districts}</td>
                  <td title={objectiveText(view.players[l.playerId]!.objectiveId)}>{l.objective}</td>
                  <td><b>{l.total}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted small">Ressources : {view.config.resourceScore ?? 10} pts chacune · dettes déduites. Survole « Obj. » pour voir les objectifs secrets.</p>
        <button className="btn gold wide" onClick={onQuit}>Retour à l'accueil</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Menu({ onClose, onQuit }: { onClose: () => void; onQuit: () => void }) {
  const reduced = useGame((s) => s.reducedMotion);
  const setReduced = useGame((s) => s.setReducedMotion);
  const me = useGame((s) => s.ctrl!.me);
  const view = useGame((s) => s.view!);
  return (
    <Sheet title="Menu" onClose={onClose}>
      <p className="small">
        Ton objectif secret : <b>{objectiveText(view.players[me]!.objectiveId)}</b>
      </p>
      <label className="toggle">
        <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} /> Réduire les animations
      </label>
      <Rules />
      <button className="btn danger wide" onClick={onQuit}>Quitter la partie</button>
    </Sheet>
  );
}

export function Rules() {
  return (
    <details className="rules">
      <summary>Règles en bref</summary>
      <ul>
        <li>12 manches. À ton tour : lance le dé de mouvement (1-4) et le dé de ressources, avance, résous ta case.</li>
        <li>Propriété libre : achète-la (il doit te rester 25 D) ou refuse → enchère ouverte à tous.</li>
        <li>Possède 2 propriétés sur 3 d'un quartier pour le contrôler (+10 % de loyer, bonus) et y construire (niveaux 1 → 3).</li>
        <li>Chance : pioche 2 cartes, garde-en 1. Passage à Départ : +40 D et 1 carte. Une carte jouée par tour, pendant ton tour.</li>
        <li>+10 D au début de chaque tour. Taxe : 15 D. Marché : achète ou vends des ressources.</li>
        <li>Échanges libres pendant ton tour, avec l'accord de l'autre joueur.</li>
        <li>Fin : crédits + ressources (5 pts) + 70 % des propriétés + 50 % des bâtiments + 25 pts par quartier contrôlé + objectif secret − dettes.</li>
      </ul>
    </details>
  );
}

/* ------------------------------------------------------------------ */

export default function GameUI({ onQuit }: { onQuit: () => void }) {
  const view = useGame((s) => s.view);
  const sheet = useGame((s) => s.sheet);
  const setSheet = useGame((s) => s.setSheet);
  const selected = useGame((s) => s.selected);
  const setSelected = useGame((s) => s.setSelected);
  const log = useGame((s) => s.log);
  const toast = useGame((s) => s.toast);
  const me = useGame((s) => s.ctrl?.me);
  const lastLines = useMemo(() => log.slice(-3), [log]);
  if (!view || !me) return null;
  const close = () => setSheet("none");
  return (
    <div className="ui">
      <header className="top">
        <div className="round">
          Manche
          <br />
          <b>{view.round}</b>/{RULES.rounds}
        </div>
        <PlayersBar view={view} />
        <button className="icon-btn menu" onClick={() => setSheet("menu")} aria-label="Menu">☰</button>
      </header>
      <div className="ticker" onClick={() => setSheet("log")}>
        {lastLines.map((l) => (
          <div key={l.id} className={l.mine ? "mine" : ""}>{l.text}</div>
        ))}
      </div>
      <footer className="bottom">
        <ActionPanel view={view} />
      </footer>
      {toast && <div className={`toast ${toast.tone}`}>{toast.text}</div>}
      {selected !== null && sheet === "none" && <PropertySheet view={view} index={selected} onClose={() => setSelected(null)} />}
      {sheet === "hand" && <HandSheet view={view} onClose={close} />}
      {sheet === "build" && <BuildSheet view={view} onClose={close} />}
      {sheet === "trade" && <TradeComposer view={view} onClose={close} />}
      {sheet === "market" && <MarketSheet view={view} onClose={close} />}
      {sheet === "menu" && <Menu onClose={close} onQuit={onQuit} />}
      {sheet === "log" && (
        <Sheet title="Journal de la partie" onClose={close}>
          <div className="log">
            {[...log].reverse().map((l) => (
              <div key={l.id} className={l.mine ? "mine" : ""}>{l.text}</div>
            ))}
          </div>
        </Sheet>
      )}
      {view.phase === "FINISHED" && <EndScreen view={view} onQuit={onQuit} />}
    </div>
  );
}
