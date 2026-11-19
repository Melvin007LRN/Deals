/**
 * Comparaison de variantes d'équilibrage (R03).
 * Usage : npx tsx packages/sim/src/variants.ts --games 10000
 * Chaque variante : N parties, tables de profil Mixte, alternance 3 / 4 joueurs, mêmes seeds pour toutes les variantes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { OFFICIAL_CONFIG, RULES_VERSION, type RuleConfig } from "@deals/engine";
import { runGame, type GameResult } from "./run.ts";

const args = process.argv.slice(2);
const N = Number(args[args.indexOf("--games") + 1] ?? 10000) || 10000;
const BASE = 30_000_000;
const D14 = [1, 2, 2, 3, 3, 4];
const D24 = [2, 2, 3, 3, 4, 4];
const SEAT = [0, 10, 20, 30];
const SEAT2 = [0, 20, 40, 60];

const VARIANTS: { key: string; label: string; config: Partial<RuleConfig> }[] = [
  { key: "V0", label: "Règles d'origine du dossier (référence)", config: {} },
  { key: "V1", label: "Dé de mouvement 1-2-2-3-3-4", config: { movementDie: D14 } },
  { key: "V2", label: "Carte piochée au passage de Départ", config: { drawOnStart: true } },
  { key: "V3", label: "+10 D au début de chaque tour", config: { turnIncome: 10 } },
  { key: "V4", label: "Compensation de siège +0/+10/+20/+30 D", config: { seatBonus: SEAT } },
  { key: "V5", label: "V1 + V2 (dé 1-4, carte au Départ)", config: { movementDie: D14, drawOnStart: true } },
  { key: "V6", label: "V1 + V2 + V4", config: { movementDie: D14, drawOnStart: true, seatBonus: SEAT } },
  { key: "V7", label: "V1 + V2 + V3 + V4", config: { movementDie: D14, drawOnStart: true, turnIncome: 10, seatBonus: SEAT } },
  { key: "V9", label: "V7 avec compensation forte +0/+20/+40/+60 D", config: { movementDie: D14, drawOnStart: true, turnIncome: 10, seatBonus: SEAT2 } },
  { key: "V10", label: "V1 + V2 + +5 D par tour + compensation forte", config: { movementDie: D14, drawOnStart: true, turnIncome: 5, seatBonus: SEAT2 } },
  { key: "V8", label: "Dé 2-2-3-3-4-4 + carte au Départ + compensation de siège", config: { movementDie: D24, drawOnStart: true, seatBonus: SEAT } },
];

const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
const median = (x: number[]) => { const s = [...x].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]!; };

function measure(rs: GameResult[]) {
  const ps = rs.flatMap((r) => r.players);
  const seat1 = (n: number) => {
    const g = rs.filter((r) => r.players.length === n);
    return mean(g.map((r) => { const p = r.players.find((x) => x.seat === 0)!; return p.rank === 1 ? 1 / r.winners.length : 0; }));
  };
  const lastSeat = (n: number) => {
    const g = rs.filter((r) => r.players.length === n);
    return mean(g.map((r) => { const p = r.players.find((x) => x.seat === n - 1)!; return p.rank === 1 ? 1 / r.winners.length : 0; }));
  };
  const cardsPlayed: Record<number, number> = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.cardPlays)) cardsPlayed[+k] = (cardsPlayed[+k] ?? 0) + v;
  return {
    start: mean(rs.map((r) => r.startPasses / r.players.length)),
    drawn: mean(ps.map((p) => p.cardsDrawn)),
    played: mean(ps.map((p) => p.cardsPlayed)),
    cardsNeverPlayed: Object.values(cardsPlayed).filter((v) => v === 0).length,
    noSale: mean(rs.map((r) => (r.auctions ? r.auctionsNoSale / r.auctions : 0))),
    props: mean(ps.map((p) => p.properties)),
    levels: mean(ps.map((p) => p.buildings)),
    lvl3: mean(ps.map((p) => (p.maxLevel === 3 ? 1 : 0))),
    districts: mean(ps.map((p) => p.districts)),
    recovery: mean(ps.map((p) => (p.bankruptcies > 0 ? 1 : 0))),
    trades: mean(rs.map((r) => r.trades)),
    objective: mean(ps.map((p) => (p.objectiveMet ? 1 : 0))),
    seat1_3: seat1(3), seat1_4: seat1(4), last_3: lastSeat(3), last_4: lastSeat(4),
    minutes: median(rs.map((r) => r.estimatedMinutes)),
    firstLast: median(rs.map((r) => { const t = r.players.map((p) => p.total).sort((a, b) => b - a); return t[0]! / Math.max(1, t[t.length - 1]!); })),
    scoreSd: Math.sqrt(mean(ps.map((p) => p.total)).valueOf() && mean(ps.map((p) => (p.total - mean(ps.map((q) => q.total))) ** 2))),
  };
}

const started = Date.now();
const rows: { v: (typeof VARIANTS)[number]; m: ReturnType<typeof measure> }[] = [];
for (const v of VARIANTS) {
  const rs: GameResult[] = [];
  for (let i = 0; i < N; i++) {
    const n = i % 2 === 0 ? 3 : 4;
    rs.push(runGame(BASE + i, Array(n).fill("balanced"), { config: { ...OFFICIAL_CONFIG, ...v.config } }));
  }
  rows.push({ v, m: measure(rs) });
  process.stderr.write(`${v.key} terminé (${((Date.now() - started) / 1000).toFixed(0)} s)\n`);
}
const pc = (x: number) => `${(x * 100).toFixed(1)} %`;
const f = (x: number, d = 2) => x.toFixed(d);
const head = "| Mesure | " + rows.map((r) => r.v.key).join(" | ") + " |\n|---|" + rows.map(() => "---|").join("");
const line = (label: string, fn: (m: ReturnType<typeof measure>) => string) => `| ${label} | ` + rows.map((r) => fn(r.m)).join(" | ") + " |";
const report = `# DEALS — Comparaison des variantes d'équilibrage (R03)
Généré le ${new Date().toISOString()} — règles ${RULES_VERSION} — **${N} parties réellement jouées par variante** (${N * VARIANTS.length} au total), profil Mixte, alternance 3/4 joueurs, **mêmes seeds ${BASE}–${BASE + N - 1} pour toutes les variantes**. Calcul : ${((Date.now() - started) / 1000).toFixed(0)} s.
Reproduire : \`npx tsx packages/sim/src/variants.ts --games ${N}\`.
Limites : bots heuristiques (pas des humains) ; durée = modèle de temps par action ; case Événement neutre.

${VARIANTS.map((v) => `- **${v.key}** — ${v.label}`).join("\n")}

Repères : siège 1 équitable = 33,3 % (3 j.) / 25 % (4 j.) ; durée visée 25–35 min ; écart 1er/dernier < 2,5.

${head}
${line("Passages Départ / joueur", (m) => f(m.start))}
${line("Cartes piochées / joueur", (m) => f(m.drawn))}
${line("Cartes jouées / joueur", (m) => f(m.played))}
${line("Cartes jamais jouées (sur 36)", (m) => String(m.cardsNeverPlayed))}
${line("Enchères sans acheteur", (m) => pc(m.noSale))}
${line("Propriétés / joueur", (m) => f(m.props, 1))}
${line("Niveaux de bâtiment / joueur", (m) => f(m.levels, 1))}
${line("Joueurs avec un niveau 3", (m) => pc(m.lvl3))}
${line("Quartiers contrôlés / joueur", (m) => f(m.districts))}
${line("Joueurs en redressement", (m) => pc(m.recovery))}
${line("Échanges / partie", (m) => f(m.trades, 1))}
${line("Objectif secret réussi", (m) => pc(m.objective))}
${line("Victoires siège 1 (3 j.)", (m) => pc(m.seat1_3))}
${line("Victoires dernier siège (3 j.)", (m) => pc(m.last_3))}
${line("Victoires siège 1 (4 j.)", (m) => pc(m.seat1_4))}
${line("Victoires dernier siège (4 j.)", (m) => pc(m.last_4))}
${line("Écart score 1er/dernier (médiane)", (m) => f(m.firstLast))}
${line("Durée estimée médiane (min)", (m) => f(m.minutes, 1))}
`;
mkdirSync("docs/simulations", { recursive: true });
writeFileSync(`docs/simulations/variantes_${N}.md`, report);
writeFileSync(`docs/simulations/variantes_${N}.json`, JSON.stringify(rows.map((r) => ({ key: r.v.key, label: r.v.label, config: r.v.config, ...r.m })), null, 1));
process.stderr.write("Rapport : docs/simulations/variantes_" + N + ".md\n");
