# DEALS

Jeu de stratégie économique multijoueur (3-4 joueurs, 12 manches, plateau de 24 cases).

- `packages/engine` — moteur de règles pur, déterministe, testé (TypeScript, aucune dépendance runtime)
- `packages/sim` — bots (5 profils) et campagnes de simulation seedées
- `docs/` — audit, décisions à valider, rapports de phase et de simulation

```
npm install
npm test
npm run typecheck
npx tsx packages/sim/src/cli.ts --games 1000 --check
```

Règles en vigueur : `1.0.0-provisional` (voir `docs/DECISIONS_A_VALIDER.md`).
