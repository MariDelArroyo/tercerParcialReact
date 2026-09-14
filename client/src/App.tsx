import { useCallback, useState } from "react";

import { createGame, getHistory, sendAction } from "./api";
import type {
  ActionPayload,
  GameState,
  HistoryEntry,
  ShotTrajectory,
} from "./types";
import FinalScreen from "./screens/FinalScreen";
import GameScreen from "./screens/GameScreen";
import StartScreen from "./screens/StartScreen";

type Screen = "start" | "game" | "final";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shot, setShot] = useState<ShotTrajectory | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const startGame = async (
    player1: string,
    player2: string,
  ): Promise<void> => {
    setNotice(null);
    try {
      const state = await createGame(player1, player2);
      setGame(state);
      setScreen("game");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "No se pudo crear la partida",
      );
    }
  };

  const runAction = async (
    player: number,
    action: ActionPayload,
  ): Promise<void> => {
    if (busy || game === null) {
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const result = await sendAction(game.id, player, action);
      setGame(result.state);
      setShot(result.shot);
      if (result.state.status === "finished") {
        setScreen("final");
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Acción inválida",
      );
    } finally {
      setBusy(false);
    }
  };

  const playAgain = (): void => {
    setGame(null);
    setShot(null);
    setNotice(null);
    setScreen("start");
  };

  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      setHistory(await getHistory());
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "No se pudo cargar el historial",
      );
    }
  }, []);

  if (game === null) {
    return <StartScreen onStart={startGame} notice={notice} />;
  }

  if (screen === "final") {
    return (
      <FinalScreen
        state={game}
        history={history}
        notice={notice}
        onLoadHistory={loadHistory}
        onPlayAgain={playAgain}
      />
    );
  }

  return (
    <GameScreen
      state={game}
      notice={notice}
      shot={shot}
      busy={busy}
      onAction={runAction}
      onReset={playAgain}
    />
  );
}