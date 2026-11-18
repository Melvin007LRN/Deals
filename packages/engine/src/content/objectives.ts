/** Objectifs secrets — proposition R12 acceptée provisoirement (18/11/2026). */
export type Difficulty = "easy" | "medium" | "hard";

export interface ObjectiveDef {
  id: number;
  key: string;
  difficulty: Difficulty;
  text: string;
}

export const OBJECTIVES: readonly ObjectiveDef[] = [
  { id: 1, key: "own_3", difficulty: "easy", text: "Posséder au moins 3 propriétés." },
  { id: 2, key: "credits_120", difficulty: "easy", text: "Terminer avec au moins 120 D." },
  { id: 3, key: "level_2", difficulty: "easy", text: "Posséder un bâtiment de niveau 2 ou plus." },
  { id: 4, key: "trades_2", difficulty: "easy", text: "Réussir au moins 2 échanges." },
  { id: 5, key: "control_1", difficulty: "medium", text: "Contrôler au moins 1 quartier." },
  { id: 6, key: "four_districts", difficulty: "medium", text: "Posséder des propriétés dans 4 quartiers différents." },
  { id: 7, key: "auctions_2", difficulty: "medium", text: "Gagner au moins 2 enchères." },
  { id: 8, key: "cards_3", difficulty: "medium", text: "Jouer au moins 3 cartes." },
  { id: 9, key: "control_2", difficulty: "hard", text: "Contrôler au moins 2 quartiers." },
  { id: 10, key: "level_3", difficulty: "hard", text: "Posséder un bâtiment de niveau 3." },
  { id: 11, key: "downtown_business_built", difficulty: "hard", text: "Posséder une propriété construite au Centre-ville et une aux Affaires." },
  { id: 12, key: "clean_6", difficulty: "hard", text: "Terminer sans dette ni hypothèque avec au moins 6 propriétés." },
];

export function objective(id: number): ObjectiveDef {
  const o = OBJECTIVES[id - 1];
  if (!o) throw new Error(`Unknown objective ${id}`);
  return o;
}
