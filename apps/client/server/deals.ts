/**
 * DEALS — serveur de jeu autoritaire (Supabase Edge Function, Deno).
 * Les clients n'envoient que des intentions ; ce serveur applique le même moteur que le client et les simulations,
 * stocke l'état complet (jamais exposé) et diffuse à chaque joueur SA vue filtrée sur un canal privé.
 */
import {
  applyCommand,
  createGame,
  cryptoRng,
  eventsFor,
  viewFor,
  type Command,
  type GameEvent,
  type GameState,
} from "@deals/engine";
import { PROFILES, decide, fallback } from "@deals/sim";

const SUPA = "https://gbqgfsvwsunbmetdkdfd.supabase.co";
// clé publique (anon) : n'ouvre que les fonctions gardées par le secret serveur
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdicWdmc3Z3c3VuYm1ldGRrZGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMjI3NDAsImV4cCI6MjExMDY5ODc0MH0.hD9AVIjHm7wdZbwNOGMBo0pV_w6zWVbJjDf1RUJ36wY";
const SECRET = () => {
  const s = (globalThis as any).process?.env?.DEALS_SERVER_SECRET as string | undefined;
  if (!s) throw new HttpError(500, "Serveur non configuré");
  return s;
};
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BOT_NAMES = ["Victor", "Inès", "Marco", "Léa", "Samir", "Chloé"];
const AWAY_MS = 45_000;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* ------------------------------ base (RPC gardées) ------------------------------ */

async function rpc<T = any>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_secret: SECRET(), ...args }),
  });
  const text = await res.text();
  if (!res.ok) throw new HttpError(500, `db ${fn} ${res.status}: ${text.slice(0, 160)}`);
  return (text ? JSON.parse(text) : null) as T;
}

/* ------------------------------ utilitaires ------------------------------ */

const rand = (n: number, alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => alphabet[x % alphabet.length]).join("");
};
const hex = (n: number) => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
}
const cleanName = (n: unknown) => String(n ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 16) || "Joueur";
const cleanCode = (c: unknown) => String(c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);

interface Seat {
  room_code: string;
  player_id: string;
  name: string;
  is_bot: boolean;
  token_hash: string | null;
  channel: string | null;
  joined_at: string;
  last_seen: string;
}
interface Room {
  code: string;
  host_player: string;
  status: "lobby" | "playing" | "finished";
  max_players: number;
  fill_bots: boolean;
}
interface GameRow {
  room_code: string;
  state: GameState;
  version: number;
  processed: string[];
  next_bot_at: number;
}

async function loadAll(code: string): Promise<{ room: Room; seats: Seat[]; game: GameRow | null }> {
  const r = await rpc<{ room: Room | null; seats: Seat[]; game: GameRow | null }>("srv_room_get", { p_code: code });
  if (!r.room) throw new HttpError(404, "Partie introuvable");
  return { room: r.room, seats: r.seats, game: r.game };
}
async function loadRoom(code: string) {
  return loadAll(code);
}

async function auth(code: string, token: unknown): Promise<{ room: Room; seats: Seat[]; me: Seat }> {
  if (typeof token !== "string" || token.length < 32) throw new HttpError(401, "Jeton manquant");
  const { room, seats } = await loadRoom(code);
  const h = await sha256(token);
  const me = seats.find((s) => s.token_hash === h);
  if (!me) throw new HttpError(403, "Tu ne fais pas partie de cette partie");
  return { room, seats, me };
}

async function touch(code: string, playerId: string) {
  await rpc("srv_seat_touch", { p_code: code, p_player: playerId });
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

function seatInfo(seats: Seat[], state: GameState | null) {
  const order = state ? state.turnOrder : seats.map((s) => s.player_id);
  const now = Date.now();
  return order.map((id, i) => {
    const s = seats.find((x) => x.player_id === id)!;
    return { id, name: s.name, isBot: s.is_bot, color: COLORS[i]!, pawn: i, connected: s.is_bot || now - Date.parse(s.last_seen) < 30_000 };
  });
}

/* ------------------------------ diffusion ------------------------------ */

async function broadcast(messages: { topic: string; event: string; payload: unknown }[]) {
  if (!messages.length) return;
  const res = await fetch(`${SUPA}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map((m) => ({ ...m, private: false })) }),
  });
  if (!res.ok) console.error("broadcast", res.status, await res.text());
}

async function pushGame(seats: Seat[], state: GameState, version: number, events: GameEvent[]) {
  const info = seatInfo(seats, state);
  await broadcast(
    seats
      .filter((s) => !s.is_bot && s.channel)
      .map((s) => ({
        topic: s.channel!,
        event: "update",
        payload: { kind: "game", version, view: viewFor(state, s.player_id), events: eventsFor(events, s.player_id), seats: info, serverNow: Date.now() },
      })),
  );
}

async function pushLobby(room: Room, seats: Seat[]) {
  const info = seatInfo(seats, null);
  await broadcast(seats.filter((s) => !s.is_bot && s.channel).map((s) => ({ topic: s.channel!, event: "update", payload: { kind: "lobby", room: publicRoom(room), seats: info } })));
}

const publicRoom = (r: Room) => ({ code: r.code, host: r.host_player, status: r.status, maxPlayers: r.max_players, fillBots: r.fill_bots });

/* ------------------------------ état de jeu ------------------------------ */

async function loadGame(code: string): Promise<GameRow> {
  const { game } = await loadAll(code);
  if (!game) throw new HttpError(409, "La partie n'a pas commencé");
  return game;
}

/** Applique une commande avec verrou optimiste (version). Retourne null si conflit. */
async function commit(code: string, row: GameRow, cmd: Command, cmdId: string | null, nextBotAt?: number) {
  const r = applyCommand(row.state, cmd, { rng: cryptoRng(), now: Date.now() });
  if (!r.ok) return { ok: false as const, error: r.error, code: r.code };
  const processed = cmdId ? [...row.processed.slice(-60), cmdId] : row.processed;
  const v = await rpc<number | null>("srv_game_update", { p_code: code, p_version: row.version, p_state: r.state, p_processed: processed, p_next_bot_at: nextBotAt ?? row.next_bot_at, p_finished: r.state.phase === "FINISHED" });
  if (v === null) return { ok: false as const, error: "conflict", code: "CONFLICT" };
  return { ok: true as const, state: r.state, version: row.version + 1, events: r.events };
}

/** Qui doit décider maintenant (pour les bots et les joueurs absents). */
function deciders(s: GameState): string[] {
  if (s.phase === "FINISHED") return [];
  if (s.phase === "AUCTION") return [...s.auction!.activeBidders];
  if (s.phase === "TRADE_PENDING") return [s.trade!.toId];
  return [s.turnOrder[s.activeIndex]!];
}

/** Une étape d'automatisation : échéances, bots, joueurs absents. */
async function automate(code: string, seats: Seat[]): Promise<boolean> {
  const row = await loadGame(code);
  const s = row.state;
  const now = Date.now();
  if (s.phase === "FINISHED") return false;
  const arbiter = s.turnOrder[s.activeIndex]!;
  let cmd: Command | null = null;
  if (s.phase === "AUCTION" && s.auction && now >= s.auction.deadline) cmd = { type: "CLOSE_AUCTION", playerId: arbiter };
  else if (s.phase === "TRADE_PENDING" && s.trade && now >= s.trade.expiresAt) cmd = { type: "EXPIRE_TRADE", playerId: arbiter };
  else if (now >= row.next_bot_at) {
    const auto = new Set(seats.filter((x) => x.is_bot || now - Date.parse(x.last_seen) > AWAY_MS).map((x) => x.player_id));
    const ds = deciders(s).filter((id) => auto.has(id)).sort(() => Math.random() - 0.5);
    const rng = { int: (n: number) => Math.floor(Math.random() * n) };
    for (const id of ds) {
      const c = decide(s, id, PROFILES.balanced, rng, now);
      if (c) {
        cmd = c;
        break;
      }
    }
    // un joueur absent en enchère : il passe
    if (!cmd && s.phase === "AUCTION") {
      const away = ds.find((id) => id !== s.auction!.highestBidderId);
      if (away) cmd = { type: "PASS_AUCTION", playerId: away };
    }
  }
  if (!cmd) return false;
  let res = await commit(code, row, cmd, null, now + 800 + Math.floor(Math.random() * 900));
  if (!res.ok && res.code !== "CONFLICT") {
    const fb = fallback(s, now).find((c) => c.playerId === cmd!.playerId && ["END_TURN", "PASS_AUCTION", "DECLINE_PROPERTY", "PAY_TAX", "ROLL_DICE", "REJECT_TRADE"].includes(c.type));
    if (fb) res = await commit(code, row, fb, null, now + 800);
  }
  if (res.ok) await pushGame(seats, res.state, res.version, res.events);
  return res.ok;
}

/* ------------------------------ actions ------------------------------ */

async function handle(body: Record<string, any>) {
  const action = body.action;
  if (action === "create") {
    const max = body.maxPlayers === 3 ? 3 : 4;
    let code = "";
    for (let i = 0; i < 5; i++) {
      code = rand(5);
      if (!(await rpc<boolean>("srv_room_exists", { p_code: code }))) break;
    }
    const playerId = `p_${hex(6)}`;
    const token = hex(24);
    const channel = `deals-${hex(12)}`;
    await rpc("srv_room_create", { p_code: code, p_host: playerId, p_max: max, p_fill: body.fillBots !== false });
    await rpc("srv_seat_insert", { p_code: code, p_player: playerId, p_name: cleanName(body.name), p_bot: false, p_token_hash: await sha256(token), p_channel: channel });
    return { code, playerId, token, channel };
  }
  const code = cleanCode(body.code);
  if (code.length !== 5) throw new HttpError(400, "Code de partie invalide");

  if (action === "join") {
    const { room, seats } = await loadRoom(code);
    if (room.status !== "lobby") throw new HttpError(409, "La partie a déjà commencé");
    if (seats.length >= room.max_players) throw new HttpError(409, "La partie est complète");
    const playerId = `p_${hex(6)}`;
    const token = hex(24);
    const channel = `deals-${hex(12)}`;
    await rpc("srv_seat_insert", { p_code: code, p_player: playerId, p_name: cleanName(body.name), p_bot: false, p_token_hash: await sha256(token), p_channel: channel });
    const after = await loadRoom(code);
    await pushLobby(after.room, after.seats);
    return { code, playerId, token, channel };
  }

  const { room, seats, me } = await auth(code, body.token);
  await touch(code, me.player_id);

  if (action === "lobby") return { room: publicRoom(room), seats: seatInfo(seats, null), me: me.player_id };

  if (action === "start") {
    if (room.host_player !== me.player_id) throw new HttpError(403, "Seul l'hôte peut lancer la partie");
    if (room.status !== "lobby") throw new HttpError(409, "Déjà lancée");
    const all = [...seats];
    if (room.fill_bots) {
      const used = new Set(all.map((s) => s.name));
      const names = BOT_NAMES.filter((n) => !used.has(n));
      while (all.length < room.max_players) {
        const bot = { room_code: code, player_id: `b_${hex(4)}`, name: names.shift() ?? "Bot", is_bot: true, token_hash: null, channel: null };
        await rpc("srv_seat_insert", { p_code: code, p_player: bot.player_id, p_name: bot.name, p_bot: true, p_token_hash: null, p_channel: null });
        all.push({ ...bot, joined_at: new Date().toISOString(), last_seen: new Date().toISOString() });
      }
    }
    if (all.length < 3) throw new HttpError(409, "Il faut au moins 3 joueurs (active les bots)");
    const { state, events } = createGame(all.map((s) => ({ id: s.player_id, name: s.name })), { rng: cryptoRng(), now: Date.now() });
    await rpc("srv_game_start", { p_code: code, p_state: state, p_next_bot_at: Date.now() + 1500 });
    await pushGame(all, state, 0, events);
    return { ok: true };
  }

  if (action === "state") {
    if (room.status === "lobby") return { kind: "lobby", room: publicRoom(room), seats: seatInfo(seats, null), me: me.player_id };
    const row = await loadGame(code);
    return { kind: "game", version: row.version, view: viewFor(row.state, me.player_id), events: [], seats: seatInfo(seats, row.state), serverNow: Date.now(), me: me.player_id };
  }

  if (action === "command") {
    const cmd = body.cmd as Command;
    if (!cmd || typeof cmd !== "object" || typeof cmd.type !== "string") throw new HttpError(400, "Commande invalide");
    const cmdId = typeof body.cmdId === "string" ? body.cmdId.slice(0, 64) : null;
    // l'identité vient du jeton, jamais du client
    const safe = { ...cmd, playerId: me.player_id } as Command;
    for (let attempt = 0; attempt < 4; attempt++) {
      const row = await loadGame(code);
      if (cmdId && row.processed.includes(cmdId)) return { ok: true, duplicate: true };
      const res = await commit(code, row, safe, cmdId);
      if (res.ok) {
        await pushGame(seats, res.state, res.version, res.events);
        return { ok: true, version: res.version };
      }
      if (res.code !== "CONFLICT") return { ok: false, error: res.error, code: res.code };
    }
    throw new HttpError(409, "Partie très sollicitée, réessaie");
  }

  if (action === "tick") {
    if (room.status !== "playing") return { ok: true };
    const changed = await automate(code, seats);
    return { ok: true, changed, serverNow: Date.now() };
  }

  throw new HttpError(400, "Action inconnue");
}

export async function serve(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (req.method !== "POST") throw new HttpError(405, "POST attendu");
    const raw = await req.text();
    if (raw.length > 20_000) throw new HttpError(413, "Requête trop grande");
    const body = JSON.parse(raw);
    const out = await handle(body);
    return new Response(JSON.stringify(out), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const message = e instanceof HttpError ? e.message : "Erreur serveur";
    if (!(e instanceof HttpError)) console.error(e);
    return new Response(JSON.stringify({ error: message }), { status, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
