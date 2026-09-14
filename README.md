# 🚀 Nébula: Duelo Estelar

Juego web multijugador de **estrategia por turnos** para 2 jugadores en el mismo
dispositivo. Frontend **React + TypeScript + Vite**, backend **Express +
TypeScript**, comunicación REST con JSON y `fetch`, pruebas **Playwright** y
publicación en **Render** vía GitHub Actions.

> 🔗 **Aplicación publicada:** https://tu-app.onrender.com _(completar la URL real del despliegue)_

---

## Índice

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Comandos](#comandos)
- [Arquitectura](#arquitectura)
- [Cómo se juega](#cómo-se-juega)
- [API REST (resumen)](#api-rest-resumen)
- [Variables de entorno](#variables-de-entorno)
- [GitHub Actions](#github-actions)
- [Documentación](#documentación)
- [Docker (decisión)](#docker-decisión)

---

## Requisitos

- **Node.js ≥ 22** (desarrollado y probado con Node 24 y Node 22).
- npm (incluido con Node).

## Instalación

```bash
# Desde la raíz del repositorio (workspaces: client + server + e2e)
npm install

# Instalar el navegador de Playwright (una sola vez, para pruebas E2E locales)
npx playwright install chromium
```

## Comandos

```bash
npm run dev:client     # Frontend en modo desarrollo (Vite, con proxy /api → 3000)
npm run dev:server     # Backend en modo desarrollo (compila tsc y arranca Express)
npm run build          # Compila frontend y backend
npm start              # Pone en línea la app completa en http://localhost:3000
npm run start:prod     # build + start (lo que usa Playwright y Render)
npm run lint           # ESLint frontend + backend
npm run typecheck      # Validación de tipos frontend + backend
npm run test:e2e       # Pruebas E2E headless (Playwright)
npm run test:e2e:headed  # Pruebas E2E visuales en Chrome
```

> Si el puerto 3000 está ocupado, usa otro:
> `$env:PORT=3210; npm run test:e2e` (PowerShell) o `PORT=3210 npm run test:e2e` (bash).

## Arquitectura

```
┌──────────────┐   POST/GET JSON (HTTP)   ┌──────────────────────┐
│ React (SPA)  │ ───────────────────────► │ Express (server)      │
│  client/     │ ◄─────────────────────── │  /api/games, /actions │
│  tablero, HUD│     { state } + errors   │  lógica del juego     │
└──────────────┘                          └──────────────────────┘
        ▲                                         │ server/dist/index.js sirve
        │ express.static(client/dist)             │ client/dist + SPA fallback
        └─────────────────────────────────────────┘  (mismo dominio y puerto)
```

- **React** representa el escenario, captura interacciones y actualiza la UI con
  el estado que devuelve el servidor. No posee la lógica del juego.
- **Express** crea partidas, las valida, calcula resultados (daño, escudos,
  deriva de cristales, cometa), conserva el estado y registra el historial.
- **Ninguna librería externa** para lógica, estado, routing o interfaz: solo
  React, Express, TypeScript, Vite, ESLint y Playwright. CSS propio.

## Cómo se juega

1. En la pantalla de inicio se escriben los **dos nombres** y se pulsa
   **Comenzar partida**.
2. Cada turno el jugador activo elige **una acción**:
   **Mover**, **Reunir** (+12⚡ sobre un cristal), **Disparar** (8⚡, línea
   recta, los cristales bloquean), **Escudo** (10⚡, reduce el próximo impacto a −5)
   o **Pasar** (+2⚡).
3. Los **cristales** 💠 derivan por el tablero y un **cometa** ☄️ cruza cada 4
   turnos dañando lo que toca (−12).
4. **Termina** cuando un casco llega a 0, o al límite de **60 turnos** (gana el
   de más casco; empate si igualan).

Detalles completos en [docs/reglas.md](docs/reglas.md).

## API REST (resumen)

| Método | Ruta | Entrada | Salida |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | `{ "ok": true }` |
| `POST` | `/api/games` | `{ "player1": "Ana", "player2": "Beto" }` | 201 `{ id, state }` |
| `GET` | `/api/games/:id` | — | 200 `{ state }` |
| `POST` | `/api/games/:id/actions` | `{ "player": 1, "action": { "type": "move", "direction": "right" } }` | 200 `{ state, messages, shot }` |
| `GET` | `/api/games` | — | 200 `{ games: [...] }` (historial) |

Tipos de acción: `move` (con `direction`), `collect`, `shoot` (con `direction`),
`shield`, `pass`. Errores → `400` con `{ "error": "mensaje" }`.

Ejemplos completos con JSON de entrada/salida en [docs/api.md](docs/api.md).

## Variables de entorno

| Variable | Dónde | Uso |
| --- | --- | --- |
| `PORT` | Render / local | Puerto HTTP del servidor (Render lo inyecta) |
| `VITE_PROXY_TARGET` | local (dev) | Destino del proxy de Vite para `/api` |
| `BASE_URL` | Playwright | URL contra la que corre E2E (local o publicada) |
| `RENDER_DEPLOY_HOOK_URL` | Secreto GitHub | Deploy Hook de Render (workflow `deploy.yml`) |
| `RENDER_PUBLIC_URL` | Secreto GitHub | URL pública para verificación post-deploy |

## GitHub Actions

| Workflow | Propósito | Resultado verificable |
| --- | --- | --- |
| `lint.yml` | ESLint (frontend + backend) y typecheck | ✓ Ticks de Lint y Typecheck |
| `e2e.yml` | Pruebas E2E headless con Playwright en CI | ✓ 6 tests + reporte como artefacto |
| `deploy.yml` | Compilar y publicar la app completa en Render | ✓ Deploy Hook + verificación HTTP de la URL pública |

Se ejecutan con `push` a `main`, `pull_request` y manualmente
(`workflow_dispatch`).

## Documentación

- [docs/introduccion.md](docs/introduccion.md) — propósito y experiencia
- [docs/reglas.md](docs/reglas.md) — reglas, estados, interacción y finalización
- [docs/api.md](docs/api.md) — diseño REST con ejemplos JSON
- [docs/decisiones.md](docs/decisiones.md) — decisiones técnicas, riesgos y cambios
- [docs/investigacion.md](docs/investigacion.md) — Playwright y Render
- [docs/uso_ia.md](docs/uso_ia.md) — registro de uso de IA
- [docs/video.md](docs/video.md) — guion del video de 3–5 min

## Docker (decisión)

**No se usa Docker.** Render publica la aplicación completa (frontend + backend)
desde un solo Web Service con `npm install && npm run build` y `npm start`. La
estrategia y sus alternativas están explicadas en
[docs/investigacion.md](docs/investigacion.md) y en `render.yaml`.