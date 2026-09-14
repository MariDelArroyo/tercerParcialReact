# 🚀 Nébula: Duelo Estelar — Introducción

## Nombre y descripción

**Nébula: Duelo Estelar** es un juego web multijugador de estrategia por turnos
para **dos jugadores** que comparten el mismo dispositivo (modo "hot seat" o
"pantalla partida"). Cada jugador comanda una nave en una nebulosa: 🚀 (Capitán 1)
y 👾 (Capitán 2).

La nebulosa está llena de **cristales de energía** 💠 que derivan suavemente con
el paso de los turnos; mover tu nave sobre uno lo recolecta al pasar, y reunir
cristales otorga energía. La energía permite disparar
rayos y activar escudos. Además, cada cierto turnos entra un **cometa** ☄️ que
cruza el tablero destruyendo todo lo que encuentra a su paso.

## Propósito del proyecto

El proyecto cumple una doble meta:

1. **Producto**: un juego web completo, original, jugable y publicado en una URL.
2. **Arquitectura**: demostrar el flujo completo cliente-servidor. El backend
   (Express) es quien **valida cada acción**, **calcula los resultados**, genera
   los elementos aleatorios y conserva el estado de cada partida. El frontend
   (React) representa el escenario, envía acciones a través de la API REST con
   `fetch` y refleja el estado que el servidor devuelve.

## Experiencia de juego propuesta

El jugador **observa** un tablero a pantalla completa con las dos naves, los
cristales y el cometa. **Elige** una acción por turno entre cinco opciones
(moverse, reunir, disparar, escudo o pasar), con costos y consecuencias
diferentes. El **sistema** responde validando la acción en el servidor y
actualizando el tablero, las barras de vida/energía, el registro de mensajes y la
pantalla de resultados al finalizar.

La partida **termina** cuando un jugador reduce a cero el casco del rival o
cuando se alcanza el límite de 60 turnos: gana quien conserve más casco y, si
empatan, la partida resulta en empate.

## Alcance tecnológico

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite |
| Backend | Express 5 + TypeScript |
| Comunicación | API REST HTTP, JSON, `fetch` nativo |
| Estilos | CSS propio (sin frameworks) |
| Pruebas E2E | Playwright (headless en CI, visual en Chrome) |
| CI/CD | GitHub Actions (lint, e2e, deploy) |
| Publicación | Render (https://render.com/) |

Sin librerías externas para lógica de juego, estado o interfaz: solo React,
Express, TypeScript y las herramientas mínimas de construcción (Vite, ESLint,
TypeScript, Playwright).