import { useState } from "react";

import type { ActionPayload, GameState } from "../types";

interface ControlsProps {
  state: GameState;
  busy: boolean;
  onAction: (action: ActionPayload) => Promise<void>;
}

type Mode = "none" | "move" | "shoot";

export default function Controls({ state, busy, onAction }: ControlsProps) {
  const [mode, setMode] = useState<Mode>("none");
  const myPlayer = state.players.find((player) => player.id === state.turn);
  const disabled = busy || state.status !== "playing";

  const fire = (action: ActionPayload): void => {
    setMode("none");
    void onAction(action);
  };

  return (
    <div className="controls" data-testid="controls">
      <div className="mode-buttons">
        <button
          type="button"
          data-testid="btn-mover"
          className="control-button"
          disabled={disabled}
          onClick={() => setMode(mode === "move" ? "none" : "move")}
        >
          🧭 Mover
        </button>
        <button
          type="button"
          data-testid="btn-disparar"
          className="control-button"
          disabled={disabled || (myPlayer?.energy ?? 0) < 8}
          onClick={() => setMode(mode === "shoot" ? "none" : "shoot")}
        >
          💥 Disparar (8⚡)
        </button>
        <button
          type="button"
          data-testid="btn-reunir"
          className="control-button"
          disabled={disabled}
          onClick={() => fire({ type: "collect" })}
        >
          💠 Reunir (+12⚡)
        </button>
        <button
          type="button"
          data-testid="btn-escudo"
          className="control-button"
          disabled={disabled || (myPlayer?.energy ?? 0) < 10}
          onClick={() => fire({ type: "shield" })}
        >
          🛡️ Escudo (10⚡)
        </button>
        <button
          type="button"
          data-testid="btn-pasar"
          className="control-button"
          disabled={disabled}
          onClick={() => fire({ type: "pass" })}
        >
          ⏭️ Pasar (+2⚡)
        </button>
      </div>

      {mode === "move" ? (
        <p className="mode-hint">Elige hacia dónde moverte:</p>
      ) : null}
      {mode === "shoot" ? (
        <p className="mode-hint">Elige la dirección del disparo:</p>
      ) : null}

      {mode !== "none" ? (
        <div className="direction-pad">
          <button
            type="button"
            data-testid={`btn-${mode}-up`}
            className="dir-button"
            onClick={() => fire({ type: mode, direction: "up" })}
          >
            ↑
          </button>
          <button
            type="button"
            data-testid={`btn-${mode}-left`}
            className="dir-button"
            onClick={() => fire({ type: mode, direction: "left" })}
          >
            ←
          </button>
          <span className="dir-label">
            {mode === "move" ? "🧭 Mover" : "💥 Disparar"}
          </span>
          <button
            type="button"
            data-testid={`btn-${mode}-right`}
            className="dir-button"
            onClick={() => fire({ type: mode, direction: "right" })}
          >
            →
          </button>
          <button
            type="button"
            data-testid={`btn-${mode}-down`}
            className="dir-button"
            onClick={() => fire({ type: mode, direction: "down" })}
          >
            ↓
          </button>
        </div>
      ) : null}
    </div>
  );
}