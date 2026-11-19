import { BOARD, card, objective, type GameEvent } from "@deals/engine";

const sp = (i: unknown) => BOARD[Number(i)]?.name ?? `case ${String(i)}`;
const RES: Record<string, string> = { credits: "D", materials: "Matériau", energy: "Énergie" };

/** Texte du journal pour un événement (null = pas affiché). */
export function describe(e: GameEvent, name: (id?: string) => string): string | null {
  const who = name(e.playerId);
  const d = e.data as Record<string, any>;
  switch (e.type) {
    case "TURN_STARTED": return `— Manche ${d.round} · tour de ${who}${d.recovery ? " (redressement)" : ""}`;
    case "DICE_ROLLED": return `${who} lance : ${d.movement} case${d.movement > 1 ? "s" : ""} · ${({ credits: "+10 D", materials: "+1 Matériau", energy: "+1 Énergie", choice: "Choix" } as Record<string, string>)[d.resource]}`;
    case "START_PASSED": return `${who} passe par Départ : +${d.reward} D`;
    case "START_CARD_DRAWN": return `${who} pioche une carte au Départ`;
    case "PROPERTY_BOUGHT": return `${who} achète ${sp(d.propertyIndex)} (${d.price} D)`;
    case "PROPERTY_DECLINED": return `${who} refuse ${sp(d.propertyIndex)} : enchère !`;
    case "AUCTION_WON": return `${name(d.winnerId)} remporte ${sp(d.propertyIndex)} pour ${d.paid} D`;
    case "AUCTION_NO_SALE": return `Aucun acheteur pour ${sp(d.propertyIndex)}`;
    case "BID_PLACED": return `${who} enchérit ${d.amount} D`;
    case "RENT_PAID": return d.amount > 0 ? `${who} paie ${d.amount} D de loyer à ${name(d.ownerId)}` : null;
    case "TAX_PAID": return `${who} paie la taxe : ${d.amount} D`;
    case "BUILT": return `${who} construit ${sp(d.propertyIndex)} → niveau ${d.level}`;
    case "BUILDING_SOLD": return `${who} revend un niveau sur ${sp(d.propertyIndex)} (+${d.refund} D)`;
    case "PROPERTY_MORTGAGED": return `${who} hypothèque ${sp(d.propertyIndex)} (+${d.amount} D)`;
    case "MORTGAGE_REDEEMED": return `${who} lève l'hypothèque de ${sp(d.propertyIndex)}`;
    case "CHANCE_DRAWN": return `${who} pioche ${d.count} carte${d.count > 1 ? "s" : ""} Chance`;
    case "CARD_PLAYED": return `${who} joue « ${card(d.cardId).name} »${d.targetPlayerId ? ` sur ${name(d.targetPlayerId)}` : d.propertyIndex !== undefined ? ` sur ${sp(d.propertyIndex)}` : ""}`;
    case "ATTACK_BLOCKED": return `🛡️ Attaque bloquée (${({ insurance: "Assurance", legalProtection: "Protection juridique", realtyInsurance: "Assurance immobilière", counterOffensive: "Contre-offensive", bonus_downtown: "bonus Centre-ville" } as Record<string, string>)[d.by] ?? d.by})`;
    case "PROPERTY_SEIZED": return `⚔️ ${sp(d.propertyIndex)} est saisie et mise aux enchères`;
    case "PROPERTIES_SWAPPED": return `${who} fusionne ${sp(d.a)} ⇄ ${sp(d.b)}`;
    case "TRADE_PROPOSED": return `${who} propose un échange à ${name(d.trade.toId)}`;
    case "TRADE_ACCEPTED": return `🤝 Échange conclu entre ${name(d.fromId)} et ${name(d.toId)}`;
    case "TRADE_REJECTED": return `${who} refuse l'échange`;
    case "TRADE_EXPIRED": return `Offre d'échange expirée`;
    case "MARKET_BOUGHT": return `${who} achète 1 ${RES[d.kind]} au marché`;
    case "MARKET_SOLD": return `${who} vend 1 ${RES[d.kind]} au marché`;
    case "RECOVERY_STARTED": return `⚠️ ${who} entre en redressement (+${d.advance} D de dette)`;
    case "FORCED_SALE_STARTED": return `⚠️ Vente forcée des propriétés de ${who}`;
    case "EVENT_SPACE_NEUTRAL": return `Actualité économique : rien à signaler`;
    case "GAME_FINISHED": return `🏁 Fin de la partie`;
    case "CREDITS_GAINED":
      if (d.reason === "bonus_commercial") return `${who} : +${d.amount} D (bonus Commercial)`;
      if (["coup_de_pouce", "magnat", "courtier", "turn_income", "guaranteed_income"].includes(d.reason)) return `${who} : +${d.amount} D`;
      return null;
    case "OBJECTIVE_DEALT": return null;
    default: return null;
  }
}

export function objectiveText(id: number): string {
  return id ? objective(id).text : "Objectif secret";
}
