import { create } from "zustand";
import type { GameEvent, PlayerId, PlayerView } from "@deals/engine";
import { describe } from "./describe.ts";
import type { GameController, SeatInfo } from "./types.ts";

export interface DiceAnim {
  movement: number;
  resource: string;
  start: number;
  id: number;
}
export interface PawnAnim {
  playerId: PlayerId;
  path: number[];
  from: number;
  start: number;
}
export interface Fx {
  id: number;
  kind: "coins" | "build" | "buy" | "attack" | "shield" | "card" | "start" | "deal";
  index?: number;
  playerId?: PlayerId;
  amount?: number;
  start: number;
}
export interface LogLine {
  id: number;
  text: string;
  mine: boolean;
}

export const DICE_MS = 1300;
export const STEP_MS = 260;

interface Store {
  ctrl: GameController | null;
  view: PlayerView | null;
  seats: SeatInfo[];
  dice: DiceAnim | null;
  pawns: Record<PlayerId, PawnAnim>;
  fx: Fx[];
  log: LogLine[];
  toast: { id: number; text: string; tone: "info" | "error" | "good" } | null;
  selected: number | null;
  sheet: "none" | "hand" | "trade" | "build" | "market" | "rules" | "menu" | "log";
  reducedMotion: boolean;
  busyUntil: number;
  attach(c: GameController): void;
  detach(): void;
  setSelected(i: number | null): void;
  setSheet(s: Store["sheet"]): void;
  notify(text: string, tone?: "info" | "error" | "good"): void;
  setReducedMotion(v: boolean): void;
}

let uid = 1;
let unsub: (() => void) | null = null;

export const useGame = create<Store>((set, get) => ({
  ctrl: null,
  view: null,
  seats: [],
  dice: null,
  pawns: {},
  fx: [],
  log: [],
  toast: null,
  selected: null,
  sheet: "none",
  reducedMotion: (() => {
    try {
      return localStorage.getItem("deals.reducedMotion") === "1" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  })(),
  busyUntil: 0,
  attach(c) {
    unsub?.();
    set({ ctrl: c, seats: c.seats(), view: c.view(), log: [], fx: [], pawns: {}, dice: null, sheet: "none", selected: null });
    unsub = c.onUpdate((view, events) => onUpdate(view, events));
  },
  detach() {
    unsub?.();
    unsub = null;
    get().ctrl?.dispose();
    set({ ctrl: null, view: null, seats: [], log: [], fx: [], pawns: {}, dice: null });
  },
  setSelected: (i) => set({ selected: i }),
  setSheet: (sheet) => set({ sheet }),
  notify(text, tone = "info") {
    const id = uid++;
    set({ toast: { id, text, tone } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 2600);
  },
  setReducedMotion(v) {
    try {
      localStorage.setItem("deals.reducedMotion", v ? "1" : "0");
    } catch {
      /* stockage indisponible : réglage limité à la session */
    }
    set({ reducedMotion: v });
  },
}));

/** Transforme les événements du moteur en animations et en lignes de journal. */
function onUpdate(view: PlayerView, events: GameEvent[]): void {
  const st = useGame.getState();
  const now = performance.now();
  const fast = st.reducedMotion;
  let t = Math.max(now, st.busyUntil);
  const nameOf = (id?: string) => (id ? st.seats.find((x) => x.id === id)?.name ?? id : "");
  const me = st.ctrl?.me;
  const log: LogLine[] = [];
  const fx: Fx[] = [];
  let dice = st.dice;
  const pawns = { ...st.pawns };
  for (const e of events) {
    const line = describe(e, nameOf);
    if (line) log.push({ id: uid++, text: line, mine: e.playerId === me });
    const d = e.data as Record<string, any>;
    switch (e.type) {
      case "DICE_ROLLED":
        dice = { movement: d.movement, resource: d.resource, start: t, id: uid++ };
        t += fast ? 300 : DICE_MS;
        break;
      case "PLAYER_MOVED":
        pawns[e.playerId!] = { playerId: e.playerId!, path: d.path, from: d.from, start: t };
        t += (fast ? 60 : STEP_MS) * d.path.length + 150;
        break;
      case "PROPERTY_BOUGHT":
      case "AUCTION_WON":
        fx.push({ id: uid++, kind: "buy", index: d.propertyIndex, playerId: e.playerId ?? d.winnerId, start: t });
        break;
      case "BUILT":
        fx.push({ id: uid++, kind: "build", index: d.propertyIndex, start: t });
        t += fast ? 100 : 500;
        break;
      case "RENT_PAID":
        if (d.amount > 0) fx.push({ id: uid++, kind: "coins", index: d.propertyIndex, amount: d.amount, start: t });
        break;
      case "START_PASSED":
        fx.push({ id: uid++, kind: "start", index: 0, amount: d.reward, start: t });
        break;
      case "ATTACK_BLOCKED":
        fx.push({ id: uid++, kind: "shield", index: d.propertyIndex, start: t });
        break;
      case "PROPERTY_SEIZED":
        fx.push({ id: uid++, kind: "attack", index: d.propertyIndex, start: t });
        break;
      case "TRADE_ACCEPTED":
        fx.push({ id: uid++, kind: "deal", start: t });
        break;
      case "CARD_PLAYED":
        fx.push({ id: uid++, kind: "card", playerId: e.playerId, start: t });
        t += fast ? 100 : 400;
        break;
    }
  }
  const keepFx = st.fx.filter((f) => now - f.start < 3000);
  useGame.setState({
    view,
    dice,
    pawns,
    fx: [...keepFx, ...fx],
    log: [...st.log, ...log].slice(-120),
    busyUntil: t,
  });
  const c = st.ctrl as unknown as { busyUntil?: number } | null;
  if (c && "busyUntil" in c) c.busyUntil = Date.now() + (t - now);
}
