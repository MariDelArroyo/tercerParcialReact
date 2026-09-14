import { useEffect } from "react";

import type { GameState, HistoryEntry } from "../types";

interface FinalScreenProps {
  state: GameState;
  history: HistoryEntry[];
  notice: string | null;
  onLoadHistory: () => Promise<void>;
  onPlayAgain: () => void;
}

function finalResult(state: GameState): string {
  if (state.status !== "finished") {
    return "La partida no terminó aún.";
  }
  if (state.draw) {
    return "🤝 ¡Empate! Ningún casco quedó por encima del rival.";
  }
  const winner = state.players.find((player) => player.id === state.winner);
  if (winner !== undefined) {
    return `🏆 ¡Gana ${winner.name}!`;
  }
  return "Fin de la partida.";
}

export default function FinalScreen({
  state,
  history,
  notice,
  onLoadHistory,
  onPlayAgain,
}: FinalScreenProps) {
  useEffect(() => {
    void onLoadHistory();
  }, [onLoadHistory]);

  const [player1, player2] = state.players;

  return (
    <main className="final-screen">
      <section className="final-card">
        <h1>🚀 Nébula: Duelo Estelar</h1>
        <h2 data-testid="resultado" className="final-result">
          {finalResult(state)}
        </h2>

        <div className="final-stats">
          <div className="final-player">
            <span className="player-ship">🚀</span>
            <strong>{player1.name}</strong>
            <span>❤️ {Math.max(0, player1.hp)}</span>
            <span>⚡ {player1.energy}</span>
          </div>
          <div className="final-player">
            <span className="player-ship">👾</span>
            <strong>{player2.name}</strong>
            <span>❤️ {Math.max(0, player2.hp)}</span>
            <span>⚡ {player2.energy}</span>
          </div>
        </div>

        <p className="final-reason">
          {state.draw
            ? "Se alcanzó el límite de turnos con igualdad de casco."
            : "Se alcanzó el límite de turnos o un casco llegó a cero."}
        </p>

        {notice !== null ? (
          <p className="notice" role="alert">
            ⚠️ {notice}
          </p>
        ) : null}

        <div className="final-actions">
          <button
            type="button"
            className="primary-button"
            data-testid="btn-jugar-de-nuevo"
            onClick={onPlayAgain}
          >
            🔄 Jugar de nuevo
          </button>
        </div>

        <section className="history">
          <h3>Historial de partidas</h3>
          {history.length === 0 ? (
            <p>Sin partidas finalizadas aún.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugadores</th>
                  <th>Resultado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{history.length - index}</td>
                    <td>
                      {entry.p1} vs {entry.p2}
                    </td>
                    <td>{entry.draw ? "Empate" : `Ganó ${entry.winner}`}</td>
                    <td>
                      {new Date(entry.finishedAt).toLocaleTimeString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </main>
  );
}