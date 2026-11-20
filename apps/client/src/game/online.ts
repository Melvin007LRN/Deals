import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { Command, GameEvent, PlayerId, PlayerView } from "@deals/engine";
import type { GameController, SeatInfo } from "./types.ts";

/** Clé publique Supabase (lecture des canaux temps réel uniquement ; les tables sont fermées au public). */
const SUPABASE_URL = "https://gbqgfsvwsunbmetdkdfd.supabase.co";
const SUPABASE_KEY = "sb_publishable_JEZTm94InprfmaZGV0EpGQ_C7blRL2e";
const API = "/api/deals";

export function onlineAvailable(): boolean {
  return true;
}

export interface Session {
  code: string;
  playerId: string;
  token: string;
  channel: string;
}

const SESSION_KEY = "deals.session";
export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* stockage indisponible : pas de reprise automatique */
  }
}
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export async function api<T = any>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({ error: "Réponse invalide du serveur" }));
  if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
  return json as T;
}

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  return (client ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }));
}

export interface LobbyState {
  room: { code: string; host: string; status: string; maxPlayers: number; fillBots: boolean };
  seats: SeatInfo[];
}

/** Abonnement au canal privé du joueur (salon puis partie). */
export function subscribe(session: Session, onMessage: (payload: any) => void): () => void {
  const ch: RealtimeChannel = sb()
    .channel(session.channel, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "update" }, ({ payload }) => onMessage(payload));
  ch.subscribe();
  return () => {
    void sb().removeChannel(ch);
  };
}

/** Partie en ligne : le serveur fait autorité, ce client n'affiche que sa vue filtrée. */
export class OnlineGame implements GameController {
  readonly mode = "online" as const;
  readonly me: PlayerId;
  private _view: PlayerView;
  private _seats: SeatInfo[];
  private version: number;
  private offset = 0;
  private listeners = new Set<(v: PlayerView, e: GameEvent[]) => void>();
  private unsub: () => void;
  private ticker: ReturnType<typeof setInterval>;
  private ticking = false;

  constructor(private session: Session, initial: { view: PlayerView; seats: SeatInfo[]; version: number; serverNow: number }) {
    this.me = session.playerId;
    this._view = initial.view;
    this._seats = initial.seats;
    this.version = initial.version;
    this.offset = initial.serverNow - Date.now();
    this.unsub = subscribe(session, (p) => {
      if (p.kind !== "game") return;
      this.receive(p.view, p.events ?? [], p.seats, p.version, p.serverNow);
    });
    // horloge serveur : échéances (enchères, échanges), bots et joueurs absents
    this.ticker = setInterval(() => void this.tick(), 1000);
    document.addEventListener("visibilitychange", this.onVisible);
  }

  private onVisible = () => {
    if (document.visibilityState === "visible") void this.resync();
  };

  private receive(view: PlayerView, events: GameEvent[], seats: SeatInfo[] | undefined, version: number, serverNow?: number) {
    if (version < this.version) return; // message en retard
    if (version === this.version && events.length === 0 && view === this._view) return;
    this.version = version;
    this._view = view;
    if (seats) this._seats = seats;
    if (serverNow) this.offset = serverNow - Date.now();
    for (const l of this.listeners) l(view, events);
  }

  private async tick() {
    if (this.ticking || this._view.phase === "FINISHED") return;
    this.ticking = true;
    try {
      const r = await api<{ serverNow?: number }>({ action: "tick", code: this.session.code, token: this.session.token });
      if (r.serverNow) this.offset = r.serverNow - Date.now();
    } catch {
      /* réseau momentanément indisponible : nouvelle tentative à la prochaine seconde */
    } finally {
      this.ticking = false;
    }
  }

  async resync() {
    try {
      const s = await api<any>({ action: "state", code: this.session.code, token: this.session.token });
      if (s.kind === "game") this.receive(s.view, [], s.seats, s.version, s.serverNow);
    } catch {
      /* ignoré : la prochaine diffusion resynchronisera */
    }
  }

  seats(): SeatInfo[] {
    return this._seats;
  }
  view(): PlayerView {
    return this._view;
  }
  now(): number {
    return Date.now() + this.offset;
  }
  onUpdate(cb: (v: PlayerView, e: GameEvent[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async send(cmd: Command): Promise<string | null> {
    try {
      const r = await api<{ ok: boolean; error?: string }>({
        action: "command",
        code: this.session.code,
        token: this.session.token,
        cmd,
        cmdId: crypto.randomUUID(),
      });
      if (!r.ok) return r.error ?? "Action refusée";
      return null;
    } catch (e) {
      void this.resync();
      return e instanceof Error ? e.message : "Erreur réseau";
    }
  }

  dispose(): void {
    clearInterval(this.ticker);
    document.removeEventListener("visibilitychange", this.onVisible);
    this.unsub();
    this.listeners.clear();
    if (this._view.phase === "FINISHED") saveSession(null);
  }
}
