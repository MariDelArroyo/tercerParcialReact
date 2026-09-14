import { randomUUID } from "node:crypto";

import type {
  Crystal,
  Direction,
  GameState,
  MeteorInfo,
  PlayerState,
  ShotTrajectory,
} from "./types";

/* =========================================================
   Constantes del juego
   ========================================================= */
const BOARD_W = 10;
const BOARD_H = 8;
const MAX_TURNS = 60;
const START_HP = 100;
const START_ENERGY = 20;
const MAX_ENERGY = 30;
const SHOOT_COST = 8;
const SHOOT_DAMAGE = 15;
const SHIELD_COST = 10;
const SHIELD_REDUCTION = 5;
const SHIELD_TURNS = 2;
const COLLECT_ENERGY = 12;
const PASS_ENERGY = 2;
const CRYSTAL_TARGET = 5;
const CRYSTAL_MAX_AGE = 16;
const CRYSTAL_DRIFT_CHANCE = 0.35;
const METEOR_INTERVAL = 4;
const METEOR_DAMAGE = 12;
const LOG_LIMIT = 14;

/* =========================================================
   Error propio para señalar acciones inválidas
   ========================================================= */
export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}

/* =========================================================
   Helpers
   ========================================================= */
let crystalSeq = 0;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function directionDelta(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case "up":
      return { dx: 0, dy: -1 };
    case "down":
      return { dx: 0, dy: 1 };
    case "left":
      return { dx: -1, dy: 0 };
    case "right":
      return { dx: 1, dy: 0 };
  }
}

function directionName(dir: Direction): string {
  switch (dir) {
    case "up":
      return "arriba";
    case "down":
      return "abajo";
    case "left":
      return "la izquierda";
    case "right":
      return "la derecha";
  }
}

function isOccupiedByShip(state: GameState, x: number, y: number): boolean {
  return state.players.some((p) => p.x === x && p.y === y);
}

function hasCrystal(state: GameState, x: number, y: number): boolean {
  return state.crystals.some((c) => c.x === x && c.y === y);
}

function pushLog(state: GameState, message: string): void {
  state.log.push(message);
  if (state.log.length > LOG_LIMIT) {
    state.log = state.log.slice(-LOG_LIMIT);
  }
}

function pushLogs(state: GameState, messages: string[]): void {
  for (const msg of messages) {
    pushLog(state, msg);
  }
}

/* =========================================================
   Generación de cristales y meteoritos
   ========================================================= */
function spawnCrystals(
  state: GameState,
  count: number,
): Crystal[] {
  const result = [...state.crystals];
  let attempts = 0;
  while (result.length < count && attempts < 500) {
    attempts += 1;
    const x = randomInt(0, BOARD_W - 1);
    const y = randomInt(0, BOARD_H - 1);
    const blocked =
      isOccupiedByShip(state, x, y) || hasCrystal(state, x, y);
    if (!blocked) {
      crystalSeq += 1;
      result.push({ id: crystalSeq, x, y, age: 0 });
    }
  }
  return result;
}

function spawnMeteor(): MeteorInfo {
  const edge = randomInt(0, 3);
  switch (edge) {
    case 0:
      return { x: randomInt(0, BOARD_W - 1), y: 0, dx: 0, dy: 1 };
    case 1:
      return {
        x: randomInt(0, BOARD_W - 1),
        y: BOARD_H - 1,
        dx: 0,
        dy: -1,
      };
    case 2:
      return { x: 0, y: randomInt(0, BOARD_H - 1), dx: 1, dy: 0 };
    default:
      return {
        x: BOARD_W - 1,
        y: randomInt(0, BOARD_H - 1),
        dx: -1,
        dy: 0,
      };
  }
}

/* =========================================================
   Paso ambiental (derrift de cristales + cometa)
   ========================================================= */
function advanceEnvironment(
  state: GameState,
  envMessages: string[],
): void {
  /* ── Cristales ── */
  for (const c of state.crystals) {
    c.age += 1;
    if (Math.random() < CRYSTAL_DRIFT_CHANCE) {
      const cdx = randomInt(-1, 1);
      const cdy = randomInt(-1, 1);
      c.x = clamp(c.x + cdx, 0, BOARD_W - 1);
      c.y = clamp(c.y + cdy, 0, BOARD_H - 1);
    }
  }
  state.crystals = state.crystals.filter((c) => c.age < CRYSTAL_MAX_AGE);

  /* ── Cometa activo ── */
  if (state.meteor !== null) {
    state.meteor.x += state.meteor.dx;
    state.meteor.y += state.meteor.dy;
    const inBounds =
      state.meteor.x >= 0 &&
      state.meteor.x < BOARD_W &&
      state.meteor.y >= 0 &&
      state.meteor.y < BOARD_H;

    if (!inBounds) {
      state.meteor = null;
    } else {
      for (const p of state.players) {
        if (p.x === state.meteor.x && p.y === state.meteor.y) {
          p.hp = Math.max(0, p.hp - METEOR_DAMAGE);
          envMessages.push(
            `☄️ El cometa impactó a ${p.name} (−${METEOR_DAMAGE} casco).`,
          );
        }
      }
      const destroyed = state.crystals.filter(
        (c) => c.x === state.meteor!.x && c.y === state.meteor!.y,
      );
      if (destroyed.length > 0) {
        state.crystals = state.crystals.filter(
          (c) =>
            !(c.x === state.meteor!.x && c.y === state.meteor!.y),
        );
        envMessages.push("☄️ El cometa destruyó un cristal.");
      }
    }
  } else if (
    state.turnCount > 0 &&
    state.turnCount % METEOR_INTERVAL === 0
  ) {
    state.meteor = spawnMeteor();
    envMessages.push("☄️ ¡Un cometa entró en la nebulosa!");
  }

  /* ── Mantener cantidad de cristales ── */
  state.crystals = spawnCrystals(state, CRYSTAL_TARGET);
}

/* =========================================================
   Crear partida
   ========================================================= */
export function createGame(
  player1Name: string,
  player2Name: string,
): GameState {
  const y1 = randomInt(0, BOARD_H - 1);
  let y2 = randomInt(0, BOARD_H - 1);
  if (y2 === y1) {
    y2 = (y2 + 1) % BOARD_H;
  }

  const players: [PlayerState, PlayerState] = [
    {
      id: 1,
      name: player1Name,
      x: 0,
      y: y1,
      hp: START_HP,
      energy: START_ENERGY,
      shield: 0,
    },
    {
      id: 2,
      name: player2Name,
      x: BOARD_W - 1,
      y: y2,
      hp: START_HP,
      energy: START_ENERGY,
      shield: 0,
    },
  ];

  const state: GameState = {
    id: randomUUID(),
    status: "playing",
    winner: null,
    draw: false,
    turn: 1,
    turnCount: 0,
    maxTurns: MAX_TURNS,
    players,
    crystals: [],
    meteor: null,
    log: [],
  };

  state.crystals = spawnCrystals(state, CRYSTAL_TARGET);
  pushLog(state, `Comienza la partida. Turno de ${player1Name}.`);
  return state;
}

/* =========================================================
   Resultado de una acción
   ========================================================= */
export interface ActionResult {
  state: GameState;
  messages: string[];
  shot: ShotTrajectory | null;
}

/* =========================================================
   Procesar una acción
   ========================================================= */
export function applyAction(
  game: GameState,
  playerId: unknown,
  action: unknown,
): ActionResult {
  /* ── Validaciones básicas ── */
  if (game.status !== "playing") {
    throw new GameError("La partida ya terminó.");
  }
  if (playerId !== 1 && playerId !== 2) {
    throw new GameError("Jugador inválido.");
  }
  if (playerId !== game.turn) {
    throw new GameError("No es el turno de ese jugador.");
  }

  const actionType =
    typeof action === "object" && action !== null && "type" in action
      ? (action as { type: unknown }).type
      : null;

  const validTypes = new Set([
    "move",
    "collect",
    "shoot",
    "shield",
    "pass",
  ]);

  if (typeof actionType !== "string" || !validTypes.has(actionType)) {
    throw new GameError("Acción inválida.");
  }

  /* ── Copia profunda para no mutar el original ── */
  const state: GameState = structuredClone(game);
  const messages: string[] = [];
  const player = state.players.find((p) => p.id === playerId)!;
  let shot: ShotTrajectory | null = null;

  /* ── Procesar acción ── */
  switch (actionType) {
    case "move": {
      const dir = (action as { direction?: unknown }).direction;
      if (dir !== "up" && dir !== "down" && dir !== "left" && dir !== "right") {
        throw new GameError("Dirección inválida.");
      }
      const { dx, dy } = directionDelta(dir);
      const nx = player.x + dx;
      const ny = player.y + dy;
      if (nx < 0 || nx >= BOARD_W || ny < 0 || ny >= BOARD_H) {
        throw new GameError("No puedes salirte del tablero.");
      }
      if (isOccupiedByShip(state, nx, ny)) {
        throw new GameError("Esa celda está ocupada por el rival.");
      }
      player.x = nx;
      player.y = ny;
      messages.push(
        `${player.name} se movió hacia ${directionName(dir)}.`,
      );

      const landedCrystal = state.crystals.find(
        (c) => c.x === player.x && c.y === player.y,
      );
      if (landedCrystal !== undefined) {
        state.crystals = state.crystals.filter(
          (c) => c.id !== landedCrystal.id,
        );
        player.energy = Math.min(
          MAX_ENERGY,
          player.energy + COLLECT_ENERGY,
        );
        messages.push(
          `${player.name} recogió un cristal al moverse (+${COLLECT_ENERGY}⚡).`,
        );
      }
      break;
    }

    case "collect": {
      const nearbyCells = [
        { x: player.x, y: player.y },
        { x: player.x + 1, y: player.y },
        { x: player.x - 1, y: player.y },
        { x: player.x, y: player.y + 1 },
        { x: player.x, y: player.y - 1 },
      ];
      const nearby = state.crystals.filter((c) =>
        nearbyCells.some((cell) => cell.x === c.x && cell.y === c.y),
      );
      if (nearby.length === 0) {
        throw new GameError(
          "No hay cristales en tu celda ni en las adyacentes.",
        );
      }
      const collectedIds = new Set(nearby.map((c) => c.id));
      state.crystals = state.crystals.filter(
        (c) => !collectedIds.has(c.id),
      );
      const energyBefore = player.energy;
      player.energy = Math.min(
        MAX_ENERGY,
        player.energy + nearby.length * COLLECT_ENERGY,
      );
      const gained = player.energy - energyBefore;
      const plural = nearby.length === 1 ? "cristal cercano" : "cristales cercanos";
      messages.push(
        `${player.name} reunió ${nearby.length} ${plural} (+${gained}⚡).`,
      );
      break;
    }

    case "shoot": {
      const dir = (action as { direction?: unknown }).direction;
      if (dir !== "up" && dir !== "down" && dir !== "left" && dir !== "right") {
        throw new GameError("Dirección de disparo inválida.");
      }
      if (player.energy < SHOOT_COST) {
        throw new GameError("Energía insuficiente para disparar.");
      }
      player.energy -= SHOOT_COST;

      const { dx, dy } = directionDelta(dir);
      let x = player.x + dx;
      let y = player.y + dy;
      const cells: { x: number; y: number }[] = [];
      let outcome: ShotTrajectory["outcome"] = "miss";

      while (x >= 0 && x < BOARD_W && y >= 0 && y < BOARD_H) {
        cells.push({ x, y });

        const target = state.players.find(
          (p) => p.x === x && p.y === y,
        );
        if (target !== undefined) {
          if (target.shield > 0) {
            target.hp = Math.max(0, target.hp - SHIELD_REDUCTION);
            target.shield = 0;
            outcome = "hit-player";
            messages.push(
              `${player.name} disparó a ${target.name}: escudo absorbió (−${SHIELD_REDUCTION}).`,
            );
          } else {
            target.hp = Math.max(0, target.hp - SHOOT_DAMAGE);
            outcome = "hit-player";
            messages.push(
              `${player.name} disparó a ${target.name} (−${SHOOT_DAMAGE} casco).`,
            );
          }
          break;
        }

        const blockedByCrystal = state.crystals.some(
          (c) => c.x === x && c.y === y,
        );
        if (blockedByCrystal) {
          outcome = "blocked";
          messages.push("Disparo bloqueado por un cristal.");
          break;
        }

        x += dx;
        y += dy;
      }

      if (outcome === "miss") {
        messages.push(
          `${player.name} disparó... pero no dio en nada.`,
        );
      }
      shot = { direction: dir, cells, outcome };
      break;
    }

    case "shield": {
      if (player.shield > 0) {
        throw new GameError("Ya tienes un escudo activo.");
      }
      if (player.energy < SHIELD_COST) {
        throw new GameError("Energía insuficiente para activar escudo.");
      }
      player.energy -= SHIELD_COST;
      player.shield = SHIELD_TURNS;
      messages.push(`${player.name} activó su escudo.`);
      break;
    }

    case "pass": {
      player.energy = Math.min(MAX_ENERGY, player.energy + PASS_ENERGY);
      messages.push(`${player.name} pasó su turno (+${PASS_ENERGY}⚡).`);
      break;
    }
  }

  /* ── Persistir mensajes ── */
  pushLogs(state, messages);

  /* ── ¿Muerte por daño directo? ── */
  const defeated = state.players.find((p) => p.hp <= 0);
  if (defeated !== undefined) {
    const winner = state.players.find(
      (p) => p.id !== defeated.id,
    )!;
    state.status = "finished";
    state.winner = winner.id;
    pushLog(
      state,
      `💥 ${winner.name} venció a ${defeated.name}. ¡Fin de la partida!`,
    );
    return { state, messages, shot };
  }

  /* ── Reducir escudo del que actuó ── */
  if (player.shield > 0) {
    player.shield -= 1;
  }

  /* ── Paso ambiental ── */
  const envMessages: string[] = [];
  advanceEnvironment(state, envMessages);
  pushLogs(state, envMessages);

  /* ── ¿Muerte por cometa? ── */
  const meteorDead = state.players.find((p) => p.hp <= 0);
  if (meteorDead !== undefined) {
    const winner = state.players.find(
      (p) => p.id !== meteorDead.id,
    )!;
    state.status = "finished";
    state.winner = winner.id;
    pushLog(
      state,
      `💥 El cometa eliminó a ${meteorDead.name}. ¡Fin de la partida!`,
    );
    return { state, messages, shot };
  }

  /* ── ¿Turnos agotados? ── */
  state.turnCount += 1;

  if (state.turnCount >= MAX_TURNS) {
    const [a, b] = state.players;
    state.status = "finished";
    if (a.hp === b.hp) {
      state.draw = true;
      pushLog(state, "Límite de turnos. ¡Empate!");
    } else {
      const winner = a.hp > b.hp ? a : b;
      state.winner = winner.id;
      pushLog(
        state,
        `Límite de turnos. Gana ${winner.name} por casco restante.`,
      );
    }
    return { state, messages, shot };
  }

  /* ── Cambio de turno ── */
  state.turn = state.turn === 1 ? 2 : 1;
  const nextPlayer = state.players.find((p) => p.id === state.turn)!;
  pushLog(state, `Turno de ${nextPlayer.name}.`);

  return { state, messages, shot };
}