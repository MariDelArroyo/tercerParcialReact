export type Direction = "up" | "down" | "left" | "right";

export type ActionType = "move" | "collect" | "shoot" | "shield" | "pass";

export interface ActionPayload {
  type: ActionType;
  direction?: Direction;
}

export interface PlayerState {
  id: number;
  name: string;
  x: number;
  y: number;
  hp: number;
  energy: number;
  shield: number;
}

export interface Crystal {
  id: number;
  x: number;
  y: number;
  age: number;
}

export interface MeteorInfo {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface GameState {
  id: string;
  status: "playing" | "finished";
  winner: number | null;
  draw: boolean;
  turn: number;
  turnCount: number;
  maxTurns: number;
  players: [PlayerState, PlayerState];
  crystals: Crystal[];
  meteor: MeteorInfo | null;
  log: string[];
}

export interface ShotTrajectory {
  direction: Direction;
  cells: { x: number; y: number }[];
  outcome: "hit-player" | "blocked" | "miss";
}