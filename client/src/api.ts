import type {
  ActionPayload,
  GameState,
  HistoryEntry,
  ShotTrajectory,
} from "./types";

interface ActionResponse {
  state: GameState;
  messages: string[];
  shot: ShotTrajectory | null;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Error del servidor";
    throw new Error(message);
  }

  return data as T;
}

export function createGame(player1: string, player2: string): Promise<GameState> {
  return request<{ state: GameState }>("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player1, player2 }),
  }).then((data) => data.state);
}

export function getGame(gameId: string): Promise<GameState> {
  return request<{ state: GameState }>(`/api/games/${gameId}`).then(
    (data) => data.state,
  );
}

export function sendAction(
  gameId: string,
  player: number,
  action: ActionPayload,
): Promise<ActionResponse> {
  return request<ActionResponse>(`/api/games/${gameId}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, action }),
  });
}

export function getHistory(): Promise<HistoryEntry[]> {
  return request<{ games: HistoryEntry[] }>("/api/games").then(
    (data) => data.games,
  );
}