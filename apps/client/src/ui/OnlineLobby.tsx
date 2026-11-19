export default function OnlineLobby({ onBack }: { name: string; onBack: () => void }) {
  return (
    <div className="home">
      <div className="home-card">
        <p>Le mode en ligne arrive.</p>
        <button className="btn ghost wide" onClick={onBack}>Retour</button>
      </div>
    </div>
  );
}
