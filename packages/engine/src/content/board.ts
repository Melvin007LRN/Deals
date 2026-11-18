/** Plateau officiel DEALS — 24 cases (source : PLATEAU_24_CASES.md, confirmé). */
export type DistrictId = "residential" | "commercial" | "industrial" | "touristic" | "business" | "downtown";
export type SpaceType = "start" | "property" | "chance" | "market" | "event" | "tax";

export interface Space {
  index: number;
  name: string;
  type: SpaceType;
  district?: DistrictId;
  price?: number;
}

export const DISTRICTS: readonly { id: DistrictId; name: string; color: string }[] = [
  { id: "residential", name: "Résidentiel", color: "#2fa84f" },
  { id: "commercial", name: "Commercial", color: "#d8343a" },
  { id: "industrial", name: "Industriel", color: "#f08a1c" },
  { id: "touristic", name: "Touristique", color: "#19b5c4" },
  { id: "business", name: "Affaires", color: "#8a4fd8" },
  { id: "downtown", name: "Centre-ville", color: "#d9a92b" },
];

export const BOARD: readonly Space[] = [
  { index: 0, name: "Départ DEALS", type: "start" },
  { index: 1, name: "Rue des Tilleuls", type: "property", district: "residential", price: 40 },
  { index: 2, name: "Place des Jardins", type: "property", district: "residential", price: 50 },
  { index: 3, name: "Avenue du Parc", type: "property", district: "residential", price: 60 },
  { index: 4, name: "Opportunité", type: "chance" },
  { index: 5, name: "Galerie Centrale", type: "property", district: "commercial", price: 50 },
  { index: 6, name: "Marché Saint-Pierre", type: "property", district: "commercial", price: 60 },
  { index: 7, name: "Boulevard du Commerce", type: "property", district: "commercial", price: 70 },
  { index: 8, name: "Marché des ressources", type: "market" },
  { index: 9, name: "Entrepôt Nord", type: "property", district: "industrial", price: 40 },
  { index: 10, name: "Usine des Quais", type: "property", district: "industrial", price: 60 },
  { index: 11, name: "Complexe industriel", type: "property", district: "industrial", price: 80 },
  { index: 12, name: "Actualité économique", type: "event" },
  { index: 13, name: "Hôtel du Lac", type: "property", district: "touristic", price: 60 },
  { index: 14, name: "Promenade des Arts", type: "property", district: "touristic", price: 70 },
  { index: 15, name: "Grand Palace", type: "property", district: "touristic", price: 90 },
  { index: 16, name: "Coup du destin", type: "chance" },
  { index: 17, name: "Tour des Finances", type: "property", district: "business", price: 70 },
  { index: 18, name: "Place des Investisseurs", type: "property", district: "business", price: 80 },
  { index: 19, name: "Centre des Affaires", type: "property", district: "business", price: 100 },
  { index: 20, name: "Taxe municipale", type: "tax" },
  { index: 21, name: "Avenue Royale", type: "property", district: "downtown", price: 80 },
  { index: 22, name: "Grand Boulevard", type: "property", district: "downtown", price: 90 },
  { index: 23, name: "Place Impériale", type: "property", district: "downtown", price: 110 },
];

export const PROPERTY_INDICES: readonly number[] = BOARD.filter((s) => s.type === "property").map((s) => s.index);

export function space(index: number): Space {
  const s = BOARD[index];
  if (!s) throw new Error(`Invalid board index ${index}`);
  return s;
}

export function districtProperties(d: DistrictId): number[] {
  return BOARD.filter((s) => s.district === d).map((s) => s.index);
}

export function priceOf(index: number): number {
  const s = space(index);
  if (s.type !== "property" || s.price === undefined) throw new Error(`Space ${index} is not a property`);
  return s.price;
}

export function districtOf(index: number): DistrictId {
  const s = space(index);
  if (!s.district) throw new Error(`Space ${index} has no district`);
  return s.district;
}
