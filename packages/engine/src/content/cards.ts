/**
 * Catalogue des 36 cartes DEALS — texte source : CARTES_36.md (pack V2.5).
 * Écarts volontaires (décisions provisoires acceptées le 18/11/2026) :
 *  - R01 : Influence locale passe de Rare à Commune, coût 2 Mat. → 1 Mat. (cible 18/12/4/2).
 *  - R04 : Magnat → Investissement, OPA hostile → Attaque (cadre Légendaire).
 *  - R05 : OPA hostile ignore les protections.
 *  - R07 : Partenariat et Fusion reçoivent un effet réel (voir `rulesNote`).
 */
export type Family = "investment" | "attack" | "defense" | "commerce" | "politics";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type TargetKind =
  | "none"
  | "ownProperty"
  | "opponentProperty"
  | "opponent"
  | "district"
  | "resource"
  | "swap";
export type AttackKind = "minor" | "realty" | null;

export interface CardDef {
  id: number;
  key: string;
  name: string;
  family: Family;
  rarity: Rarity;
  cost: { materials: number; energy: number };
  target: TargetKind;
  attack: AttackKind;
  text: string;
  rulesNote?: string;
}

const c = (
  id: number,
  key: string,
  name: string,
  family: Family,
  rarity: Rarity,
  materials: number,
  energy: number,
  target: TargetKind,
  attack: AttackKind,
  text: string,
  rulesNote?: string,
): CardDef => ({ id, key, name, family, rarity, cost: { materials, energy }, target, attack, text, ...(rulesNote ? { rulesNote } : {}) });

export const CARDS: readonly CardDef[] = [
  // Investissement (8) + Magnat
  c(1, "placement_malin", "Placement malin", "investment", "common", 1, 0, "none", null, "Réduit de 10 D une construction ce tour, minimum 0."),
  c(2, "coup_de_pouce", "Coup de pouce", "investment", "common", 0, 1, "none", null, "Gagne 20 D."),
  c(3, "rendement_bonus", "Rendement bonus", "investment", "rare", 1, 1, "ownProperty", null, "Une propriété possédée rapporte +15 D à son prochain loyer réellement payé.", "Expire à la fin de la manche suivante si aucun loyer n'est payé (R09)."),
  c(4, "chantier_express", "Chantier express", "investment", "rare", 2, 0, "none", null, "Autorise une construction supplémentaire ce tour ; coûts et majorité restent requis."),
  c(5, "bon_investissement", "Bon investissement", "investment", "common", 0, 1, "none", null, "Gagne 1 Matériau (plafond applicable).", "Au plafond : +5 D."),
  c(6, "revenus_garantis", "Revenus garantis", "investment", "common", 1, 0, "none", null, "Gagne 20 D au prochain passage Départ ; un effet actif maximum."),
  c(7, "reduction_fiscale", "Réduction fiscale", "investment", "rare", 1, 1, "none", null, "Annule la taxe municipale de case due ce tour."),
  c(8, "nouvelle_opportunite", "Nouvelle opportunité", "investment", "epic", 2, 0, "none", null, "Réduit de 20 D un achat volontaire de propriété ce tour, pas une enchère."),
  // Attaque (10) + OPA
  c(9, "sabotage", "Sabotage", "attack", "common", 0, 1, "opponentProperty", "minor", "Prochain loyer d'une propriété adverse réduit de 50 %, minimum 0, puis effet consommé.", "Expire à la fin de la manche suivante (R09)."),
  c(10, "pression_fiscale", "Pression fiscale", "attack", "common", 0, 1, "opponent", "minor", "Une cible paie 15 D à la banque ; dette si insuffisant."),
  c(11, "greve", "Grève", "attack", "common", 1, 0, "opponentProperty", "minor", "Une propriété adverse ne peut pas être améliorée pendant le prochain tour de son propriétaire."),
  c(12, "inspection", "Inspection", "attack", "common", 0, 1, "opponent", "minor", "La cible perd 1 Matériau ; si aucun, 5 D."),
  c(13, "blocage_bancaire", "Blocage bancaire", "attack", "rare", 1, 1, "opponent", "minor", "La cible ne peut pas acheter volontairement pendant son prochain tour, mais peut enchérir."),
  c(14, "detournement", "Détournement", "attack", "common", 0, 1, "opponent", "minor", "Prend jusqu'à 10 D à un adversaire et les transfère à l'attaquant."),
  c(15, "concurrence_agressive", "Concurrence agressive", "attack", "rare", 1, 0, "opponent", "minor", "Prochain loyer reçu par une cible réduit de 10 D, minimum 0.", "Expire à la fin de la manche suivante (R09)."),
  c(16, "fraude_commerciale", "Fraude commerciale", "attack", "common", 0, 1, "opponent", "minor", "La cible perd 1 Énergie ; si aucun, 5 D."),
  c(17, "prise_de_controle", "Prise de contrôle", "attack", "epic", 2, 2, "opponentProperty", "realty", "Propriété adverse non protégée retirée puis mise aux enchères ; l'attaquant peut enchérir.", "Bâtiments vendus avec la propriété, produit de l'enchère versé à l'ancien propriétaire, propriété hypothéquée non ciblable (R06)."),
  c(18, "crise_locale", "Crise locale", "attack", "rare", 1, 1, "district", "minor", "Loyers d'un quartier réduits de 25 % jusqu'au prochain tour du lanceur ; non cumulable."),
  // Défense (6)
  c(19, "assurance", "Assurance", "defense", "common", 1, 0, "ownProperty", null, "Protège une propriété contre le prochain sabotage/réduction de loyer jusqu'au début du prochain tour du propriétaire."),
  c(20, "bouclier_financier", "Bouclier financier", "defense", "common", 0, 1, "none", null, "Réduit de 15 D la prochaine perte financière causée par une carte, pas les loyers normaux/taxes.", "Expire à la fin de la manche suivante (R09)."),
  c(21, "protection_juridique", "Protection juridique", "defense", "rare", 1, 1, "ownProperty", null, "Protège une propriété contre une attaque immobilière jusqu'au début du prochain tour du propriétaire."),
  c(22, "contre_offensive", "Contre-offensive", "defense", "epic", 0, 2, "none", null, "Protection personnelle préinstallée : annule la prochaine attaque ciblant le joueur ; l'attaquant perd 1 Énergie si possible.", "Jusqu'au début du prochain tour du joueur ; une attaque sur une de ses propriétés le cible (R09)."),
  c(23, "reserve_urgence", "Réserve d'urgence", "defense", "common", 1, 0, "none", null, "Si loyer/taxe de case provoque incapacité pendant la durée, avance 15 D sous forme de dette.", "Durée : jusqu'au début du prochain tour du joueur (R09)."),
  c(24, "assurance_immobiliere", "Assurance immobilière", "defense", "rare", 1, 0, "ownProperty", null, "Protège une propriété contre la prochaine attaque immobilière jusqu'au début du prochain tour du propriétaire."),
  // Commerce (6)
  c(25, "negociateur", "Négociateur", "commerce", "common", 1, 0, "none", null, "Réduit de 10 D le montant en Crédits que le joueur doit ajouter à un échange ce tour ; ne crée pas d'argent.", "Appliqué au prochain échange accepté ce tour où le joueur donne des Crédits (les deux côtés voient le montant réduit)."),
  c(26, "offre_speciale", "Offre spéciale", "commerce", "common", 0, 1, "none", null, "Après un échange accepté ce tour, gagne 1 Matériau."),
  c(27, "courtier", "Courtier", "commerce", "rare", 1, 0, "resource", null, "Vend une ressource à la banque contre 15 D (une seule ressource)."),
  c(28, "partenariat", "Partenariat", "commerce", "common", 0, 1, "opponent", null, "Propose un contrat ; si la cible accepte, elle verse 10 D au lanceur.", "R07 : la cible doit verser 10 D, ou à défaut céder 1 ressource (Matériau puis Énergie)."),
  c(29, "contrat_privilegie", "Contrat privilégié", "commerce", "rare", 1, 1, "none", null, "Réduit de 15 D un achat volontaire ce tour ; pas une enchère ; ne se cumule pas avec Nouvelle opportunité."),
  c(30, "fusion", "Fusion", "commerce", "epic", 2, 0, "swap", null, "Propose échange d'une propriété contre une autre ; consentement des deux joueurs.", "R07 : échange imposé de deux propriétés sans bâtiment ni hypothèque, de valeur égale à ±10 D."),
  // Politique (4)
  c(31, "influence_locale", "Influence locale", "politics", "common", 1, 0, "district", null, "+1 influence temporaire dans un quartier jusqu'à fin du tour ; ne donne pas les points de contrôle final.", "R01 : Commune, coût 1 Matériau. R08 : compte comme +1 propriété pour la majorité (construction, bonus) jusqu'à la fin du tour."),
  c(32, "vote_municipal", "Vote municipal", "politics", "common", 1, 1, "none", null, "Réduit de 10 D une taxe de case ce tour."),
  c(33, "permis_exceptionnel", "Permis exceptionnel", "politics", "rare", 2, 1, "none", null, "Autorise une construction supplémentaire, conditions habituelles maintenues."),
  c(34, "reforme_urbaine", "Réforme urbaine", "politics", "rare", 2, 0, "district", null, "Double temporairement le bonus économique d'un quartier jusqu'au prochain tour du lanceur ; ne double pas les points."),
  // Légendaires (2)
  c(35, "magnat", "Magnat", "investment", "legendary", 2, 2, "none", null, "Gagne 40 D et 1 Matériau ; si plafond, convertir en 5 D."),
  c(36, "opa_hostile", "OPA hostile", "attack", "legendary", 3, 2, "opponentProperty", "realty", "Propriété adverse non protégée remise aux enchères ; attaque immobilière limitée à une par propriété et par manche.", "R05 : ignore toutes les protections. R06 comme Prise de contrôle."),
];

export function card(id: number): CardDef {
  const d = CARDS[id - 1];
  if (!d || d.id !== id) throw new Error(`Unknown card ${id}`);
  return d;
}

export const CARD_KEYS = Object.fromEntries(CARDS.map((d) => [d.key, d.id])) as Record<string, number>;

/**
 * Révision 2 (proposition du 19/11/2026, à valider) : renforce 6 cartes jamais rentables en simulation.
 * Coûts et textes ; les effets correspondants sont dans engine.ts (s.config.cardRevision === 2).
 */
export const CARD_REVISION_2: Record<string, { cost?: { materials: number; energy: number }; target?: TargetKind; text: string }> = {
  bon_investissement: { text: "Gagne 2 Matériaux (plafond applicable, excédent converti en 5 D)." },
  vote_municipal: { cost: { materials: 1, energy: 0 }, text: "Réduit de 20 D la taxe de case ou le loyer que tu paies ce tour." },
  inspection: { text: "Vole 1 Matériau à la cible ; si elle n'en a pas, lui prend jusqu'à 10 D." },
  fraude_commerciale: { text: "Vole 1 Énergie à la cible ; si elle n'en a pas, lui prend jusqu'à 10 D." },
  blocage_bancaire: { cost: { materials: 0, energy: 1 }, text: "La cible ne peut pas acheter volontairement pendant son prochain tour, mais peut enchérir." },
  crise_locale: { text: "Aucun loyer n'est payé dans un quartier jusqu'au prochain tour du lanceur ; non cumulable." },
  assurance: { target: "none", text: "Protège toutes tes propriétés contre Sabotage, Grève et Crise locale jusqu'au début de ton prochain tour (non consommée)." },
  reforme_urbaine: { cost: { materials: 1, energy: 0 }, text: "Double le bonus économique d'un quartier jusqu'au prochain tour du lanceur ; ne double pas les points." },
};

export function cardCost(def: CardDef, revision: 1 | 2 = 1): { materials: number; energy: number } {
  return revision === 2 ? CARD_REVISION_2[def.key]?.cost ?? def.cost : def.cost;
}

export function cardTarget(def: CardDef, revision: 1 | 2 = 1): TargetKind {
  return revision === 2 ? CARD_REVISION_2[def.key]?.target ?? def.target : def.target;
}

export function cardText(def: CardDef, revision: 1 | 2 = 1): string {
  return revision === 2 ? CARD_REVISION_2[def.key]?.text ?? def.text : def.text;
}
