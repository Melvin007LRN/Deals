/**
 * Campagnes de simulation DEALS.
 * Usage : npx tsx packages/sim/src/cli.ts --games 1000 [--out docs/simulations] [--check]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { CARDS, RULES, RULES_VERSION, seededRng } from "@deals/engine";
import { PROFILES, type ProfileName } from "./agents.ts";
import { runGame, type GameResult } from "./run.ts";

const args = process.argv.slice(2);
const arg = (k: string, d: string) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : d;
};
const N = Number(arg("games", "1000"));
const OUT = arg("out", "docs/simulations");
const CHECK = args.includes("--check");
const BASE_SEED = Number(arg("seed", "20261118"));
const ALL: ProfileName[] = ["investor", "aggressive", "negotiator", "random", "balanced"];

interface Campaign {
  key: string;
  label: string;
  tables: (i: number) => ProfileName[];
}

const pick = (seed: number, n: number) => {
  const r = seededRng(seed);
  return Array.from({ length: n }, () => ALL[r.int(ALL.length)]!);
};

const CAMPAIGNS: Campaign[] = [
  { key: "3p_mixte_equilibre", label: "3 joueurs — profil Mixte à chaque siège (structure, avantage de siège)", tables: () => ["balanced", "balanced", "balanced"] },
  { key: "4p_mixte_equilibre", label: "4 joueurs — profil Mixte à chaque siège", tables: () => ["balanced", "balanced", "balanced", "balanced"] },
  { key: "profils_melanges", label: "Tables de 3 ou 4 joueurs aux profils tirés au hasard (taux de victoire par profil)", tables: (i) => pick(BASE_SEED + 7_000_000 + i, 3 + (i % 2)) },
  { key: "extremes", label: "Scénarios extrêmes : tables 100 % Agressif / 100 % Investisseur / 100 % Négociateur / 100 % Aléatoire", tables: (i) => Array(3 + (i % 2)).fill((["aggressive", "investor", "negotiator", "random"] as ProfileName[])[i % 4]) },
];

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const pct = (x: number) => `${(100 * x).toFixed(1)} %`;
const f1 = (x: number) => x.toFixed(1);

function summarize(c: Campaign, results: GameResult[]) {
  const players = results.flatMap((r) => r.players);
  const winShare = (filter: (p: (typeof players)[number]) => boolean) => {
    let wins = 0;
    let n = 0;
    for (const r of results) for (const p of r.players) if (filter(p)) {
      n++;
      if (p.rank === 1) wins += 1 / r.winners.length;
    }
    return { rate: n ? wins / n : 0, n };
  };
  const seats = [0, 1, 2, 3].map((seat) => ({ seat, ...winShare((p) => p.seat === seat) })).filter((x) => x.n > 0);
  const profiles = ALL.map((pr) => ({ profile: pr, ...winShare((p) => p.profile === pr) })).filter((x) => x.n > 0);
  const firstLast = results.map((r) => {
    const t = r.players.map((p) => p.total).sort((a, b) => b - a);
    return t[t.length - 1]! > 0 ? t[0]! / t[t.length - 1]! : Infinity;
  });
  const cardTotals: Record<number, number> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.cardPlays)) cardTotals[Number(k)] = (cardTotals[Number(k)] ?? 0) + v;
  const m = {
    games: results.length,
    scoreMean: mean(players.map((p) => p.total)),
    scoreMedian: median(players.map((p) => p.total)),
    scoreSd: sd(players.map((p) => p.total)),
    winnerScoreMean: mean(results.map((r) => Math.max(...r.players.map((p) => p.total)))),
    propsMean: mean(players.map((p) => p.properties)),
    noPropertyEnd: mean(players.map((p) => (p.properties === 0 ? 1 : 0))),
    buildingsMean: mean(players.map((p) => p.buildings)),
    level3Share: mean(players.map((p) => (p.maxLevel === 3 ? 1 : 0))),
    districtsMean: mean(players.map((p) => p.districts)),
    bankruptcyRate: mean(players.map((p) => (p.bankruptcies > 0 ? 1 : 0))),
    debtEnd: mean(players.map((p) => (p.debt > 0 ? 1 : 0))),
    cardsDrawnMean: mean(players.map((p) => p.cardsDrawn)),
    cardsPlayedMean: mean(players.map((p) => p.cardsPlayed)),
    objectiveRate: mean(players.map((p) => (p.objectiveMet ? 1 : 0))),
    startPassesPerPlayer: mean(results.map((r) => r.startPasses / r.players.length)),
    auctionsMean: mean(results.map((r) => r.auctions)),
    auctionsNoSale: mean(results.map((r) => (r.auctions ? r.auctionsNoSale / r.auctions : 0))),
    tradesMean: mean(results.map((r) => r.trades)),
    tradeOffersMean: mean(results.map((r) => r.tradeOffers)),
    realtyAttacksMean: mean(results.map((r) => r.realtyAttacks)),
    minutesMedian: median(results.map((r) => r.estimatedMinutes)),
    minutesP90: [...results.map((r) => r.estimatedMinutes)].sort((a, b) => a - b)[Math.floor(results.length * 0.9)]!,
    roundsNoPropMean: mean(players.map((p) => p.roundsWithoutProperty)),
    firstLastMedian: median(firstLast.filter(Number.isFinite)),
    rejected: results.reduce((a, r) => a + r.rejected, 0),
    commands: results.reduce((a, r) => a + r.commands, 0),
    violations: results.flatMap((r) => r.invariantViolations),
    seats,
    profiles,
    cardTotals,
  };
  const alerts: string[] = [];
  for (const pr of profiles) if (c.key === "profils_melanges" && pr.rate > 0.45) alerts.push(`Profil ${PROFILES[pr.profile].label} > 45 % de victoires (${pct(pr.rate)})`);
  if (m.bankruptcyRate > 0.2) alerts.push(`Redressements > 20 % des joueurs (${pct(m.bankruptcyRate)})`);
  if (m.noPropertyEnd > 0.15) alerts.push(`> 15 % de joueurs sans propriété en fin (${pct(m.noPropertyEnd)})`);
  if (m.propsMean < 2 || m.propsMean > 7) alerts.push(`Moyenne de propriétés hors [2 ; 7] (${f1(m.propsMean)})`);
  if (m.firstLastMedian > 2.5) alerts.push(`Écart premier/dernier médian > 2,5 (${m.firstLastMedian.toFixed(2)})`);
  if (m.minutesMedian < 20 || m.minutesMedian > 40) alerts.push(`Durée médiane estimée hors [20 ; 40] min (${f1(m.minutesMedian)} min)`);
  const fair = 1 / (c.key.startsWith("4p") ? 4 : 3);
  for (const s of seats) if (c.key.endsWith("equilibre") && Math.abs(s.rate - fair) > 0.05) alerts.push(`Avantage de siège ${s.seat + 1} : ${pct(s.rate)} (équitable ${pct(fair)})`);
  if (m.violations.length) alerts.push(`${m.violations.length} violations d'invariants`);
  return { m, alerts };
}

function render(c: Campaign, firstSeed: number, sum: ReturnType<typeof summarize>): string {
  const { m, alerts } = sum;
  const unplayed = CARDS.filter((d) => (m.cardTotals[d.id] ?? 0) === 0).map((d) => d.name);
  const topCards = CARDS.map((d) => ({ d, n: m.cardTotals[d.id] ?? 0 })).sort((a, b) => b.n - a.n);
  return `### ${c.label}
Parties réellement terminées : **${m.games}** — seeds ${firstSeed} à ${firstSeed + m.games - 1} — commandes acceptées : ${m.commands} — décisions d'agents refusées par le moteur : ${m.rejected}${CHECK ? ` — invariants vérifiés à chaque commande : ${m.violations.length} violation(s)` : ""}

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | ${f1(m.scoreMean)} / ${f1(m.scoreMedian)} / ${f1(m.scoreSd)} |
| Score moyen du vainqueur | ${f1(m.winnerScoreMean)} |
| Ratio score 1er / dernier (médiane) | ${m.firstLastMedian.toFixed(2)} |
| Propriétés par joueur en fin | ${f1(m.propsMean)} |
| Joueurs sans propriété en fin | ${pct(m.noPropertyEnd)} |
| Manches passées sans propriété (moyenne) | ${f1(m.roundsNoPropMean)} |
| Niveaux de bâtiment par joueur | ${f1(m.buildingsMean)} — joueurs ayant un niveau 3 : ${pct(m.level3Share)} |
| Quartiers contrôlés par joueur | ${m.districtsMean.toFixed(2)} |
| Passages par Départ par joueur | ${m.startPassesPerPlayer.toFixed(2)} |
| Pioches Chance / cartes jouées par joueur | ${m.cardsDrawnMean.toFixed(2)} / ${m.cardsPlayedMean.toFixed(2)} |
| Objectif secret réussi | ${pct(m.objectiveRate)} |
| Joueurs passés en redressement | ${pct(m.bankruptcyRate)} — avec dette en fin : ${pct(m.debtEnd)} |
| Enchères par partie (sans acheteur) | ${f1(m.auctionsMean)} (${pct(m.auctionsNoSale)}) |
| Échanges acceptés / proposés par partie | ${f1(m.tradesMean)} / ${f1(m.tradeOffersMean)} |
| Attaques immobilières par partie | ${m.realtyAttacksMean.toFixed(2)} |
| Durée estimée (modèle) médiane / 90e centile | ${f1(m.minutesMedian)} / ${f1(m.minutesP90)} min |

Victoires par siège : ${m.seats.map((s) => `siège ${s.seat + 1} ${pct(s.rate)}`).join(" · ")}
${c.key === "profils_melanges" ? `\nVictoires par profil : ${m.profiles.map((p) => `${PROFILES[p.profile].label} ${pct(p.rate)} (n=${p.n})`).join(" · ")}\n` : ""}
Cartes les plus jouées : ${topCards.slice(0, 5).map((x) => `${x.d.name} (${x.n})`).join(", ")}. Jamais jouées : ${unplayed.length ? unplayed.join(", ") : "aucune"}.

**Alertes :** ${alerts.length ? alerts.map((a) => `\n- ⚠️ ${a}`).join("") : "aucune"}
`;
}

const started = Date.now();
const sections: string[] = [];
const json: Record<string, unknown> = {};
for (const [ci, c] of CAMPAIGNS.entries()) {
  const firstSeed = BASE_SEED + ci * 1_000_000;
  const results: GameResult[] = [];
  for (let i = 0; i < N; i++) results.push(runGame(firstSeed + i, c.tables(i), { checkInvariants: CHECK }));
  const sum = summarize(c, results);
  sections.push(render(c, firstSeed, sum));
  json[c.key] = { ...sum.m, alerts: sum.alerts, firstSeed };
  process.stderr.write(`${c.key}: ${N} parties en ${((Date.now() - started) / 1000).toFixed(1)} s\n`);
}
const stamp = new Date().toISOString();
const report = `# Rapport de simulation DEALS
Généré le ${stamp} — règles **${RULES_VERSION}** — moteur @deals/engine 1.0.0 — ${N} parties par campagne (${N * CAMPAIGNS.length} au total) — seed de base ${BASE_SEED}
Durée de calcul : ${((Date.now() - started) / 1000).toFixed(0)} s.

**Ce rapport est réel et reproductible** : \`npx tsx packages/sim/src/cli.ts --games ${N} --seed ${BASE_SEED}${CHECK ? " --check" : ""}\`.
Limites : les agents sont des heuristiques (pas des joueurs humains) ; la durée est estimée par un modèle de temps par action (${Object.keys({}).length || "voir run.ts"}), pas mesurée ; la case Événement est neutre (R11 non validé).
Paramètres provisoires : réserve ${RULES.voluntaryBuyReserve} D, taxe ${RULES.taxAmount} D, plafonds ${RULES.maxMaterials}/${RULES.maxEnergy}, hypothèque ${RULES.mortgagePercent} %/${RULES.mortgageRedeemPercent} %, enchère départ ${RULES.auctionStartPercent} %.

Profils : ${Object.values(PROFILES).map((p) => `${p.label} (achat marge ${p.buyMargin}, enchère ${p.bidFraction * 100} %, attaque ×${p.attack}, échange ×${p.trade})`).join(" ; ")}.

${sections.join("\n")}`;
mkdirSync(OUT, { recursive: true });
const file = `${OUT}/rapport_${N}.md`;
writeFileSync(file, report);
writeFileSync(`${OUT}/rapport_${N}.json`, JSON.stringify({ generatedAt: stamp, rules: RULES_VERSION, games: N, baseSeed: BASE_SEED, campaigns: json }, null, 1));
process.stderr.write(`Rapport écrit : ${file}\n`);
