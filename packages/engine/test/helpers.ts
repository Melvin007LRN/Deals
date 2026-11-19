import { expect } from "vitest";
import { OFFICIAL_CONFIG, applyCommand, createGame } from "../src/engine.ts";
import { checkInvariants } from "../src/invariants.ts";
import { seededRng } from "../src/rng.ts";
import type { Command, Ctx, GameState, Rng } from "../src/types.ts";
import { CARD_KEYS } from "../src/content/cards.ts";

/** RNG scripté : renvoie les valeurs données puis 0. */
export function scripted(values: number[]): Rng {
  const q = [...values];
  return { int: (n: number) => Math.min(q.length ? q.shift()! : 0, n - 1) };
}

export const MOVE = (m: 1 | 2 | 3) => (m - 1) * 2;
export const RES = { credits: 0, materials: 2, energy: 4, choice: 5 } as const;

export function ctx(rng: Rng = seededRng(1), now = 0): Ctx {
  return { rng, now };
}

export function newGame(n = 3, seed = 42) {
  const ids = ["A", "B", "C", "D"].slice(0, n);
  // les tests unitaires de règles utilisent les règles d'origine (valeurs du dossier) ; la variante v1.1 a ses propres tests
  const { state } = createGame(ids.map((id) => ({ id, name: id })), ctx(seededRng(seed)), OFFICIAL_CONFIG);
  const order = state.turnOrder;
  return { s: state, a: order[0]!, b: order[1]!, c: order[2]!, d: order[3] };
}

export function run(s: GameState, cmd: Command, c: Ctx = ctx()): GameState {
  const r = applyCommand(s, cmd, c);
  if (!r.ok) throw new Error(`${cmd.type} refusée : ${r.code} ${r.error}`);
  const v = checkInvariants(r.state);
  expect(v, `invariants après ${cmd.type}`).toEqual([]);
  return r.state;
}

export function runEv(s: GameState, cmd: Command, c: Ctx = ctx()) {
  const r = applyCommand(s, cmd, c);
  if (!r.ok) throw new Error(`${cmd.type} refusée : ${r.code} ${r.error}`);
  return r;
}

export function rejects(s: GameState, cmd: Command, code: string, c: Ctx = ctx()): void {
  const r = applyCommand(s, cmd, c);
  expect(r.ok, `${cmd.type} aurait dû être refusée (${code})`).toBe(false);
  if (!r.ok) expect(r.code).toBe(code);
}

/** Lance les dés avec un mouvement et une face ressource choisis. */
export function roll(s: GameState, playerId: string, m: 1 | 2 | 3, face: keyof typeof RES = "credits"): GameState {
  return run(s, { type: "ROLL_DICE", playerId }, ctx(scripted([MOVE(m), RES[face]])));
}

/** Donne une carte (par clé) dans la main d'un joueur en la retirant de la pioche. */
export function giveCard(s: GameState, playerId: string, key: string): number {
  const cardId = CARD_KEYS[key];
  if (!cardId) throw new Error(`carte ${key}`);
  const inst = Number(Object.entries(s.cardInstances).find(([, c]) => c === cardId)![0]);
  s.deck = s.deck.filter((i) => i !== inst);
  s.discard = s.discard.filter((i) => i !== inst);
  s.players[playerId]!.hand.push(inst);
  return inst;
}

export function own(s: GameState, playerId: string | null, ...indices: number[]): void {
  for (const i of indices) s.properties[i]!.ownerId = playerId;
}

/** Amène l'état en phase MANAGE pour le joueur actif sans effet de case (arrivée sur Départ simulée). */
export function toManage(s: GameState): GameState {
  s.phase = "MANAGE";
  s.turn.landed = true;
  return s;
}

/** Termine le tour du joueur actif (MANAGE requis). */
export function endTurn(s: GameState): GameState {
  return run(s, { type: "END_TURN", playerId: s.turnOrder[s.activeIndex]! });
}

/** Fixe un niveau de bâtiment cohérent (coûts officiels payés pour chaque niveau). */
export function setLevel(s: GameState, index: number, level: 0 | 1 | 2 | 3): void {
  const costs = [20, 35, 50].slice(0, level);
  const pr = s.properties[index]!;
  pr.level = level;
  pr.levelPaid = costs;
  pr.buildingCredits = costs.reduce((a, b) => a + b, 0);
}
