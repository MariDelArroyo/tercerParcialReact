import type { PlayerState } from "../types";

interface PlayerPanelProps {
  player: PlayerState;
  isTurn: boolean;
}

export default function PlayerPanel({ player, isTurn }: PlayerPanelProps) {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / 100) * 100));
  const energyPercent = Math.max(
    0,
    Math.min(100, (player.energy / 30) * 100),
  );

  return (
    <aside className={`player-panel ${isTurn ? "active" : ""}`}>
      <div className="player-head">
        <span className="player-ship">
          {player.id === 1 ? "🚀" : "👾"}
        </span>
        <div>
          <h2>{player.name}</h2>
          {isTurn ? (
            <span className="on-turn">En turno</span>
          ) : (
            <span className="waiting">Esperando</span>
          )}
        </div>
      </div>

      <div className="stat-row">
        <span className="stat-label">❤️ Casco</span>
        <div className="bar hp-bar">
          <div className="bar-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <span className="stat-value">{player.hp} / 100</span>
      </div>

      <div className="stat-row">
        <span className="stat-label">⚡ Energía</span>
        <div className="bar energy-bar">
          <div className="bar-fill" style={{ width: `${energyPercent}%` }} />
        </div>
        <span className="stat-value">{player.energy} / 30</span>
      </div>

      <div className="stat-row">
        <span className="stat-label">🛡️ Escudo</span>
        <span className="stat-value">
          {player.shield > 0 ? `Activo (${player.shield})` : "Inactivo"}
        </span>
      </div>
    </aside>
  );
}