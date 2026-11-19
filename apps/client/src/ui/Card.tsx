import type { PlayerView } from "@deals/engine";
import { FAMILY_LABEL, RARITY_COLOR, RARITY_LABEL, cardInfo } from "./helpers.ts";

export function GameCard({ view, cardId, onClick, selected, small, disabled }: { view: PlayerView; cardId: number; onClick?: () => void; selected?: boolean; small?: boolean; disabled?: boolean }) {
  const { def, text, cost } = cardInfo(view, cardId);
  return (
    <button
      type="button"
      className={`gcard ${small ? "small" : ""} ${selected ? "selected" : ""} ${disabled ? "disabled" : ""} r-${def.rarity}`}
      style={{ backgroundImage: `url(/cards/${def.family}.webp)` }}
      onClick={onClick}
      aria-label={`${def.name}, ${FAMILY_LABEL[def.family]}, ${RARITY_LABEL[def.rarity]}. ${text}`}
    >
      <span className="gcard-name">{def.name}</span>
      <span className="gcard-rarity" style={{ color: RARITY_COLOR[def.rarity] }}>
        ◆ {RARITY_LABEL[def.rarity]}
      </span>
      <span className="gcard-text">{text}</span>
      <span className="gcard-cost">
        {cost.materials > 0 && <b className="res mat">{cost.materials}</b>}
        {cost.energy > 0 && <b className="res nrj">{cost.energy}</b>}
      </span>
    </button>
  );
}

export function CardBack({ small }: { small?: boolean }) {
  return <div className={`gcard back ${small ? "small" : ""}`} style={{ backgroundImage: "url(/cards/back.webp)" }} aria-hidden />;
}
