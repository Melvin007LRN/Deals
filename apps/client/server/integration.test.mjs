// Base simulée : reproduit srv_* (secret, verrou optimiste) et capture les diffusions temps réel.
import { createHash } from "node:crypto";
const SECRET = process.env.DEALS_SERVER_SECRET;
const HASH = createHash("sha256").update(SECRET).digest("hex");
const db = { rooms: {}, seats: {}, games: {} };
const casts = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  url = String(url);
  const body = init?.body ? JSON.parse(init.body) : {};
  const out = (x, status = 200) => new Response(JSON.stringify(x), { status });
  if (url.includes("/realtime/v1/api/broadcast")) { casts.push(...body.messages); return out({}, 202); }
  const fn = url.split("/rpc/")[1];
  if (createHash("sha256").update(body.p_secret ?? "").digest("hex") !== HASH) return out({ message: "forbidden" }, 403);
  const now = new Date().toISOString();
  switch (fn) {
    case "srv_room_exists": return out(!!db.rooms[body.p_code]);
    case "srv_room_create": db.rooms[body.p_code] = { code: body.p_code, host_player: body.p_host, status: "lobby", max_players: body.p_max, fill_bots: body.p_fill }; db.seats[body.p_code] = []; return out(null);
    case "srv_seat_insert": db.seats[body.p_code].push({ room_code: body.p_code, player_id: body.p_player, name: body.p_name, is_bot: body.p_bot, token_hash: body.p_token_hash, channel: body.p_channel, joined_at: now, last_seen: now }); return out(null);
    case "srv_seat_touch": { const s = db.seats[body.p_code].find((x) => x.player_id === body.p_player); if (s) s.last_seen = now; return out(null); }
    case "srv_room_get": return out({ room: db.rooms[body.p_code] ?? null, seats: db.seats[body.p_code] ?? [], game: db.games[body.p_code] ? structuredClone(db.games[body.p_code]) : null });
    case "srv_game_start": { const r = db.rooms[body.p_code]; if (r.status !== "lobby") return out({ message: "already" }, 400); db.games[body.p_code] = { room_code: body.p_code, state: body.p_state, version: 0, processed: [], next_bot_at: body.p_next_bot_at }; r.status = "playing"; return out(null); }
    case "srv_game_update": { const g = db.games[body.p_code]; if (g.version !== body.p_version) return out(null); Object.assign(g, { state: body.p_state, version: g.version + 1, processed: body.p_processed, next_bot_at: body.p_next_bot_at }); if (body.p_finished) db.rooms[body.p_code].status = "finished"; return out(g.version); }
  }
  return out({ message: "unknown " + fn }, 404);
};
const { POST } = await import("../api/deals.js");
const call = async (body) => { const r = await POST(new Request("http://x/api/deals", { method: "POST", body: JSON.stringify(body) })); return { status: r.status, json: await r.json() }; };
const ok = (c, m) => { console.log(c ? "OK:" : "ÉCHEC:", m); if (!c) process.exitCode = 1; };

const A = (await call({ action: "create", name: "Alice", maxPlayers: 4, fillBots: true })).json;
ok(/^[A-Z0-9]{5}$/.test(A.code) && A.token.length === 48, `salon créé ${A.code}`);
const B = (await call({ action: "join", code: A.code.toLowerCase(), name: "<b>Bob</b>" })).json;
ok(B.token, "Bob rejoint (code insensible à la casse)");
ok(db.seats[A.code][1].name === "bBob/b", "pseudo nettoyé des balises");
ok(!JSON.stringify(db).includes(A.token), "le jeton n'est stocké qu'en empreinte");
ok((await call({ action: "start", code: A.code, token: B.token })).status === 403, "un non-hôte ne peut pas lancer");
ok((await call({ action: "state", code: A.code, token: "x".repeat(48) })).status === 403, "jeton invalide refusé");
ok((await call({ action: "join", code: "ZZZZZ", name: "x" })).status === 404, "code inconnu refusé");
ok((await call({ action: "start", code: A.code, token: A.token })).json.ok, "l'hôte lance (bots ajoutés)");
ok((await call({ action: "join", code: A.code, name: "Tard" })).status === 409, "impossible de rejoindre une partie lancée");
let st = (await call({ action: "state", code: A.code, token: A.token })).json;
ok(st.kind === "game" && st.seats.length === 4 && st.seats.filter((s) => s.isBot).length === 2, "4 sièges dont 2 bots");
// usurpation : Alice tente d'agir au nom d'un autre joueur
const active = st.view.turnOrder[st.view.activeIndex];
const notMe = st.view.turnOrder.find((id) => id !== A.playerId && id !== active) ?? st.view.turnOrder.find((id) => id !== A.playerId);
const r0 = await call({ action: "command", code: A.code, token: A.token, cmd: { type: "ROLL_DICE", playerId: active === A.playerId ? notMe : active } });
ok(active === A.playerId ? r0.json.ok === true : r0.json.ok === false, "l'identité vient du jeton, jamais du client");
// idempotence
const humans = [A, B];
let cmds = 0, ticks = 0, dupTested = false;
const t0 = Date.now();
for (let guard = 0; guard < 20000; guard++) {
  let any = false;
  for (const H of humans) {
    const v = (await call({ action: "state", code: A.code, token: H.token })).json.view;
    if (v.phase === "FINISHED") break;
    const me = H.playerId, mine = v.turnOrder[v.activeIndex] === me;
    let cmd = null;
    if (v.phase === "AUCTION" && v.auction.activeBidders.includes(me) && v.auction.highestBidderId !== me) cmd = v.auction.currentBid === null && v.players[me].credits > 150 ? { type: "PLACE_BID", amount: v.auction.startPrice } : { type: "PASS_AUCTION" };
    else if (v.phase === "TRADE_PENDING" && v.trade.toId === me) cmd = { type: "REJECT_TRADE" };
    else if (mine) cmd = ({ PRE_ROLL: { type: "ROLL_DICE" }, RESOURCE_CHOICE: { type: "CHOOSE_RESOURCE", resource: "credits" }, BUY_DECISION: v.players[me].credits > 140 ? { type: "BUY_PROPERTY" } : { type: "DECLINE_PROPERTY" }, TAX_DUE: { type: "PAY_TAX" }, CHANCE_CHOICE: v.players[me].hand.length < 5 ? { type: "CHOOSE_CARD", keep: v.pendingDraw[0] } : { type: "CHOOSE_CARD", keep: v.pendingDraw[0], replace: v.players[me].hand[0] }, MANAGE: { type: "END_TURN" } })[v.phase] ?? null;
    if (cmd) {
      const id = crypto.randomUUID();
      const r = await call({ action: "command", code: A.code, token: H.token, cmd, cmdId: id });
      if (r.json.ok) { cmds++; any = true;
        if (!dupTested) { const before = db.games[A.code].version; const d = await call({ action: "command", code: A.code, token: H.token, cmd, cmdId: id }); ok(d.json.duplicate && db.games[A.code].version === before, "commande rejouée (même identifiant) ignorée"); dupTested = true; }
      }
    }
  }
  if (db.games[A.code].state.phase === "FINISHED") break;
  if (!any) {
    // le temps avance (bots, chronos) : on vieillit next_bot_at et les échéances
    const g = db.games[A.code]; g.next_bot_at = 0;
    if (g.state.auction) g.state.auction.deadline = Math.min(g.state.auction.deadline, Date.now() - 1);
    await call({ action: "tick", code: A.code, token: A.token }); ticks++;
  }
}
const fin = (await call({ action: "state", code: A.code, token: B.token })).json;
ok(fin.view.phase === "FINISHED" && fin.view.round === 12, `partie complète en ligne — ${cmds} commandes humaines, ${ticks} ticks serveur, ${Math.round((Date.now() - t0) / 1000)} s`);
ok(fin.view.scores.length === 4 && db.rooms[A.code].status === "finished", "scores finaux et salon clôturé");
ok(fin.view.players[A.playerId].objectiveId > 0, "objectifs révélés en fin de partie");
const gameCasts = casts.filter((c) => c.payload.kind === "game");
const bobCasts = gameCasts.filter((c) => c.topic === B.channel);
ok(bobCasts.length > 50 && gameCasts.every((c) => c.topic === A.channel || c.topic === B.channel), `diffusions privées : ${bobCasts.length} pour Bob, aucune vers les bots`);
let leak = false;
for (const c of gameCasts) {
  const viewer = c.topic === A.channel ? A.playerId : B.playerId;
  if (c.payload.view.phase === "FINISHED") continue;
  for (const [id, p] of Object.entries(c.payload.view.players)) if (id !== viewer && (p.hand.length || p.objectiveId)) leak = true;
  if ("deck" in c.payload.view || "cardInstances" in c.payload.view) leak = true;
  for (const e of c.payload.events) if (e.privateTo && e.privateTo !== viewer) leak = true;
}
ok(!leak, "aucune main, objectif, pioche ou événement privé adverse dans les diffusions");
// mauvais secret serveur
process.env.DEALS_SERVER_SECRET = "mauvais";
ok((await call({ action: "state", code: A.code, token: A.token })).status === 500, "serveur avec mauvais secret : accès base refusé");
