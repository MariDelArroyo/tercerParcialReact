import { useEffect, useState } from "react";

import Controls from "../components/Controls";
import MessageLog from "../components/MessageLog";
import PlayerPanel from "../components/PlayerPanel";
import type { ActionPayload, GameState, ShotTrajectory } from "../types";

interface GameScreenProps {
  state: GameState;
  notice: string | null;
  shot: ShotTrajectory | null;
  busy: boolean;
  onAction: (player: number, action: ActionPayload) => Promise<void>;
  onReset: () => void;
}

type CellType = "empty" | "ship1" | "ship2" | "crystal" | "meteor" | "shot";

function renderEmoji(cellType: CellType): string {
  switch (cellType) {
    case "ship1":
      return "🚀";
    case "ship2":
      return "👾";
    case "crystal":
      return "💠";
    case "meteor":
      return "☄️";
    case "shot":
      return "💥";
    default:
      return "";
  }
}

interface ProjectileAnimation {
  shot: ShotTrajectory;
  index: number;
}

export default function GameScreen({
  state,
  notice,
  shot,
  busy,
  onAction,
  onReset,
}: GameScreenProps) {
  const [animation, setAnimation] = useState<ProjectileAnimation | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAnimation((current) => {
        if (shot === null || shot.cells.length === 0) {
          return null;
        }
        if (current === null || current.shot !== shot) {
          return { shot, index: 0 };
        }
        if (current.index >= shot.cells.length - 1) {
          window.clearInterval(timer);
          return null;
        }
        return { shot, index: current.index + 1 };
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [shot]);

  const activePlayer = state.players.find(
    (player) => player.id === state.turn,
  );
  const projectileCell =
    animation !== null && animation.shot === shot && animation.index >= 0
      ? shot.cells[animation.index]
      : null;

  const cells: { type: CellType; x: number; y: number }[] = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 10; x += 1) {
      let type: CellType = "empty";

      if (state.meteor !== null && state.meteor.x === x && state.meteor.y === y) {
        type = "meteor";
      } else if (
        state.players[0].x === x &&
        state.players[0].y === y
      ) {
        type = "ship1";
      } else if (
        state.players[1].x === x &&
        state.players[1].y === y
      ) {
        type = "ship2";
      } else if (
        state.crystals.some((crystal) => crystal.x === x && crystal.y === y)
      ) {
        type = "crystal";
      }

      if (
        projectileCell !== null &&
        projectileCell.x === x &&
        projectileCell.y === y
      ) {
        type = "shot";
      }

      cells.push({ type, x, y });
    }
  }

  return (
    <main className="game-screen">
      <header className="game-header">
        <h1>🚀 Nébula: Duelo Estelar</h1>
        <div className="game-meta">
          <span data-testid="turno" className="turn-badge">
            🔄 Turno de {activePlayer?.name ?? "?"}
          </span>
          <span className="turn-counter">
            Turno {Math.min(state.turnCount + 1, state.maxTurns)} /{" "}
            {state.maxTurns}
          </span>
          <button type="button" className="small-button" onClick={onReset}>
            Abandonar
          </button>
        </div>
      </header>

      <section className="game-body">
        <PlayerPanel player={state.players[0]} isTurn={state.turn === 1} />

        <div className="board-area">
          <div
            data-testid="tablero"
            data-game-id={state.id}
            className="board"
            style={{
              gridTemplateColumns: "repeat(10, 1fr)",
              gridTemplateRows: "repeat(8, 1fr)",
            }}
          >
            {cells.map((cell, index) => (
              <div
                key={index}
                className={`cell ${
                  cell.type === "ship1"
                    ? "player1"
                    : cell.type === "ship2"
                      ? "player2"
                      : cell.type
                } ${
                  (state.turn === 1 && cell.type === "ship1") ||
                  (state.turn === 2 && cell.type === "ship2")
                    ? "turn"
                    : ""
                }`}
              >
                {renderEmoji(cell.type)}
              </div>
            ))}
          </div>
        </div>

        <PlayerPanel player={state.players[1]} isTurn={state.turn === 2} />
      </section>

      <section className="controls-zone">
        <div className="log-and-notice">
          {notice !== null ? (
            <p className="notice" role="alert">
              ⚠️ {notice}
            </p>
          ) : null}
          <MessageLog messages={state.log} />
        </div>

        <Controls
          state={state}
          busy={busy}
          onAction={(action) => onAction(state.turn, action)}
        />
      </section>
    </main>
  );
}