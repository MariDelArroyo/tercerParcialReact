import express from "express";
import path from "node:path";

import { applyAction, createGame, GameError } from "./game";
import type { GameState } from "./types";

const app = express();
app.use(express.json());

/* =========================================================
   Estado en memoria (aceptable para un demo educativo)
   ========================================================= */
const games = new Map<string, GameState>();

interface HistoryEntry {
  id: string;
  p1: string;
  p2: string;
  winner: string;
  draw: boolean;
  finishedAt: string;
}
const history: HistoryEntry[] = [];

/* =========================================================
   Rutas API
   ========================================================= */

// Salud del servidor (útil para healthchecks)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Crear partida
app.post("/api/games", (req, res) => {
  const { player1, player2 } = (req.body ?? {}) as Record<string, unknown>;

  if (
    typeof player1 !== "string" ||
    !player1.trim() ||
    typeof player2 !== "string" ||
    !player2.trim()
  ) {
    res
      .status(400)
      .json({ error: "Los nombres de ambos jugadores son obligatorios." });
    return;
  }

  const state = createGame(player1.trim(), player2.trim());
  games.set(state.id, state);
  res.status(201).json({ id: state.id, state });
});

// Historial de partidas finalizadas
app.get("/api/games", (_req, res) => {
  res.json({ games: history.slice().reverse() });
});

// Consultar estado de una partida
app.get("/api/games/:id", (req, res) => {
  const state = games.get(req.params.id);
  if (state === undefined) {
    res.status(404).json({ error: "Partida no encontrada." });
    return;
  }
  res.json({ state });
});

// Ejecutar una acción
app.post("/api/games/:id/actions", (req, res) => {
  const state = games.get(req.params.id);
  if (state === undefined) {
    res.status(404).json({ error: "Partida no encontrada." });
    return;
  }

  const { player, action } = (req.body ?? {}) as Record<string, unknown>;

  try {
    const result = applyAction(state, player, action);
    games.set(result.state.id, result.state);

    if (result.state.status === "finished") {
      const [p1, p2] = result.state.players;
      history.push({
        id: result.state.id,
        p1: p1.name,
        p2: p2.name,
        winner: result.state.draw
          ? "Empate"
          : result.state.players.find((p) => p.id === result.state.winner)
              ?.name ?? "",
        draw: result.state.draw,
        finishedAt: new Date().toISOString(),
      });
    }

    res.json({
      state: result.state,
      messages: result.messages,
      shot: result.shot,
    });
  } catch (error) {
    const message =
      error instanceof GameError
        ? error.message
        : "Acción inválida.";
    res.status(400).json({ error: message });
  }
});

/* =========================================================
   Servir el frontend compilado (mismo dominio y puerto)
   ========================================================= */
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));

// SPA fallback: cualquier ruta GET no-API devuelve index.html
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err !== undefined) {
        next(err);
      }
    });
    return;
  }
  next();
});

/* =========================================================
   Iniciar servidor
   ========================================================= */
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Nébula: Duelo Estelar → http://localhost:${port}`);
});