# 🌐 Diseño de la API REST

Toda la comunicación entre el frontend y el backend usa **JSON** y la API nativa
`fetch`. En producción el frontend compilado lo sirve el propio Express en el
**mismo dominio y puerto** (sin CORS). En desarrollo, Vite usa un proxy para
`/api` hacia Express (`3000` por defecto, configurable con `VITE_PROXY_TARGET`).

## Responsabilidades de React y de Express

**React (cliente)**
- Representa el escenario (tablero, naves, cristales, cometa, HUD).
- Captura las interacciones y construye las acciones.
- Envía las acciones al backend con `fetch` y renderiza la respuesta.
- Muestra mensajes, errores y resultados.

**Express (servidor)**
1. **Crea las partidas** y asigna estado inicial (posiciones, energía, cristales, meteorito).
2. **Valida cada acción** (turno correcto, límites del tablero, energía, etc.).
3. **Calcula el resultado completo**: daño, escudos, recolección de cristales, paso ambiental (deriva de cristales y cometa).
4. **Conserva el estado** de cada partida y el **historial** de las finalizadas.
5. Genera los eventos **aleatorios** (posiciones de cristales, cometa) que dan variabilidad.

La lógica crítica del juego **no existe en el navegador**: el cliente es "tonto"
(envía acciones y dibuja lo que el servidor devuelve).

## Endpoints

### `GET /api/health`

Salud del servidor (usada por el healthcheck del despliegue).

- **Salida** (200):
```json
{ "ok": true }
```

### `POST /api/games`

Crea una partida nueva.

- **Entrada** (JSON):
```json
{ "player1": "Ana", "player2": "Beto" }
```
- **Salida** (201):
```json
{
  "id": "f4c216c5-8219-40be-b03e-8a61acbf8076",
  "state": {
    "id": "f4c216c5-8219-40be-b03e-8a61acbf8076",
    "status": "playing",
    "winner": null,
    "draw": false,
    "turn": 1,
    "turnCount": 0,
    "maxTurns": 60,
    "players": [
      { "id": 1, "name": "Ana", "x": 0, "y": 3, "hp": 100, "energy": 20, "shield": 0 },
      { "id": 2, "name": "Beto", "x": 9, "y": 5, "hp": 100, "energy": 20, "shield": 0 }
    ],
    "crystals": [
      { "id": 1, "x": 4, "y": 2, "age": 0 },
      { "id": 2, "x": 7, "y": 3, "age": 0 }
    ],
    "meteor": null,
    "log": ["Comienza la partida. Turno de Ana."]
  }
}
```
- **Errores**: `400` si falta un nombre.
```json
{ "error": "Los nombres de ambos jugadores son obligatorios." }
```
- Escenario:
```json
{ "player1": "" }
```
→
```json
{ "error": "Los nombres de ambos jugadores son obligatorios." }
```

### `GET /api/games/:id`

Devuelve el estado actual de una partida.

- **Salida** (200): misma estructura `state` que arriba.
- **Errores**: `404` si la partida no existe.
```json
{ "error": "Partida no encontrada." }
```
- Ejemplo con `curl`:
```
curl http://localhost:3000/api/games/f4c216c5-8219-40be-b03e-8a61acbf8076
```

### `POST /api/games/:id/actions`

Ejecuta una acción del jugador cuyo turno es.

- **Entrada** (JSON): `player` (1 o 2) y `action` con `type` y, para
  mover/disparar, `direction`.
```json
{ "player": 1, "action": { "type": "move", "direction": "right" } }
```
```json
{ "player": 1, "action": { "type": "shoot", "direction": "right" } }
```
```json
{ "player": 2, "action": { "type": "collect" } }
```
```json
{ "player": 2, "action": { "type": "shield" } }
```
```json
{ "player": 1, "action": { "type": "pass" } }
```
- **Salida** (200):
```json
{
  "state": { "...": "estado actualizado" },
  "messages": ["Ana se movió hacia la derecha."],
  "shot": {
    "direction": "right",
    "cells": [ { "x": 1, "y": 3 }, { "x": 2, "y": 3 } ],
    "outcome": "miss"
  }
}
```
  `shot` es `null` salvo cuando la acción fue un disparo (alimenta la animación
  del proyectil en el cliente).
- **Errores** (400) con mensajes legibles:
```json
{ "error": "No es el turno de ese jugador." }
{ "error": "Energía insuficiente para disparar." }
{ "error": "Ya tienes un escudo activo." }
{ "error": "No puedes salirte del tablero." }
{ "error": "La partida ya terminó." }
```
- Ejemplo con `curl`:
```
curl -X POST http://localhost:3000/api/games/f4c216c5-8219-40be-b03e-8a61acbf8076/actions \
  -H "Content-Type: application/json" \
  -d '{"player":1,"action":{"type":"shoot","direction":"right"}}'
```

### `GET /api/games`

Historial de partidas finalizadas (más reciente primero).

- **Salida** (200):
```json
{
  "games": [
    {
      "id": "41aad113-1e13-4f1b-a996-2a3c29f135e1",
      "p1": "Ana",
      "p2": "Beto",
      "winner": "Ana",
      "draw": false,
      "finishedAt": "2026-09-14T06:32:39.288Z"
    }
  ]
}
```

## Comunicación real con `fetch`

El cliente usa `fetch` nativo con rutas relativas (mismo origen). Ejemplo real del
código (`client/src/api.ts`):

```ts
export function sendAction(gameId: string, player: number, action: ActionPayload) {
  return request<ActionResponse>(`/api/games/${gameId}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, action }),
  });
}
```

Todo lo que llega y se recibe es **JSON**. No hay datos de la partida escritos a
mano en el frontend: el estado siempre proviene de Express.