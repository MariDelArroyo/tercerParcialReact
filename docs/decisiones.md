# 🧭 Decisiones de diseño y planificación

Este documento registra las decisiones tomadas, su justificación, los riesgos y
los cambios importantes realizados durante el desarrollo.

## Elección del juego

**Criterios aplicados** (requisitos del examen):

| Requisito | Cómo lo cumple Nébula |
| --- | --- |
| ≥ 2 jugadores | 2 jugadores por turnos en el mismo dispositivo |
| Uso de pantalla | Tablero 10×8 a pantalla completa con HUD perimetral |
| Elementos en movimiento | Cristales a la deriva, cometa que cruza, rayos animados, naves |
| Interacción entre jugadores | Ataques, escudo, bloqueo por cristales, competencia por energía |
| Estado no trivial | Posición, casco, energía, escudo, cristales, cometa, turno, contador |
| Reglas y finalización | Turnos, acciones válidas/inválidas, victoria, empate, límite 60 |
| Decisión estratégica | 5 acciones distintas con costos y consecuencias |
| Variabilidad | Posiciones aleatorias, derivas aleatorias, cometa aleatorio, edad de cristales |
| Retroalimentación visual | Barras, contadores, turno, mensajes, errores, animaciones, resultado |

**Originalidad**: no es ninguno de los juegos de clase (serpiente, buscaminas,
tres en raya, Space Invaders). Es un duelo táctico por turnos sobre un tablero
compartido, donde las decisiones importan más que la velocidad de pulsación.

## Boceto de pantalla

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🚀 Nébula: Duelo Estelar         🔄 Turno de Ana   Turno 3 / 60  [Abandonar] │
├──────────────┬──────────────────────────────────┬─────────────────┤
│  🚀 Ana      │  ╔═══╦═══╦═══╦═══╦═══╦═══╦═══╦═══╦═══╦═══╗  │  👾 Beto      │
│ ❤️ Casco ▓▓▓ 100│  ║ 🚀║   ║   ║ 💠║   ║   ║ ☄️║   ║ 🎯║   ║  │ ❤️ Casco ▓▓▓ 100│
│ ⚡ Energía ▓▓ 20 │  ╠═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╣  │ ⚡ Energía ▓▓ 20 │
│ 🛡️ Inactivo    │  ... 8 filas, 80 celdas ...                 │ 🛡️ Inactivo    │
│            │  ╚═══╩═══╩═══╩═══╩═══╩═══╩═══╩═══╩═══╩═══╝  │               │
├──────────────┴──────────────────────────────────┴─────────────────┤
│ 📜 Registro: ▶ Ana se movió...    │ 🧭 Mover 💥 Disparar 💠 Reunir 🛡️ Escudo ⏭️ Pasar │
│                                  │      [↑][←][→][↓]  (pad direccional)         │
└──────────────────────────────────────────────────────────────────────┘
```

**Pantalla de inicio**: título, dos campos de nombre, botón "Comenzar partida" e
instrucciones desplegables.
**Pantalla final**: ganador/empate, cascos finales, "Jugar de nuevo" e historial.

## Configuración del proyecto (monorepo con workspaces)

```
tercerParcialReact/
├── client/   React + TypeScript + Vite (frontend)
├── server/   Express + TypeScript (backend / API + sirve el build del cliente)
├── e2e/      Playwright (pruebas end-to-end)
├── docs/     Esta documentación
└── .github/workflows/  lint.yml, e2e.yml, deploy.yml
```

Se eligió un **monorepo npm** (workspaces) para que un solo `npm install` desde la
raíz instale todo y para simplificar el despliegue en Render (una sola
construcción y un solo comando de inicio).

## Decisiones técnicas y su justificación

1. **Backend con la lógica del juego.** Todo el cálculo (validación, daño,
   escudos, deriva de cristales, cometa, finalización) vive en `server/src/game.ts`.
   El cliente solo envía acciones y dibuja el estado. Esto cumple el requisito de
   que la lógica crítica no exista únicamente en el navegador y hace que el examen
   sea verificable: `POST /actions` nunca confía en el cliente.
2. **Estado en memoria por simplicidad.** `Map<id, GameState>` en el proceso de
   Express. Es suficiente para una partida por turnos y para el historial del
   ejercicio; un servicio real usaría una base de datos (riesgo documentado abajo).
3. **Servir el frontend desde Express.** En producción `express.static(client/dist)`
   + fallback SPA → **un solo dominio y puerto**, sin CORS.
4. **Elementos aleatorios en el servidor.** Posiciones iniciales, derivas,
   cometa y respawning de cristales se generan en Express → cada partida es
   distinta (variabilidad).
5. **Turnos por acciones, no por jugador.** `turnCount` suma en cada acción
   válida; el límite de 60 cierra el juego de forma determinista y testeable.
6. **Animación del rayo dirigida por el servidor.** La respuesta de `POST /actions`
   incluye `shot.cells` (trayectoria) para que el cliente anime sin conocer reglas.
7. **CSS puro y componentes simples.** Se replican los patrones vistos en clase:
   componentes con estado (`useState`) y renderizado directo de tableros con
   emojis (igual que la práctica de Snake en el Examen 2).

## Riesgos técnicos y estrategias de reducción

| Riesgo | Estrategia |
| --- | --- |
| El cliente manda datos "trucados" | El servidor **ignora lo calculable**: recibe solo `player` + `action` (tipo y dirección); valida turno, límites y energía antes de mutar estado. |
| Estados incoherentes entre cliente y servidor | El servidor **nunca muta el objeto original**: trabaja sobre una copia validada y reemplaza el estado. La UI siempre se actualiza con `state` de la respuesta. |
| Acciones inválidas o respuestas lentas | Cada fallo devuelve `400` con un mensaje claro; el cliente lo muestra en un banner visible. Botones deshabilitados mientras `busy`. |
| Cometa puede terminar la partida antes | Es parte de las reglas (variabilidad); las pruebas E2E toleran finalización temprana del servidor. |
| Memoria del servidor crece | Las partidas se guardan mientras el proceso vive; para la defensa y el demo es aceptable. Se indirige a una BD como trabajo futuro. |
| Puertos locales ocupados | El `PORT` del servidor y la URL de Playwright son configurables por variables de entorno (véase `investigacion.md`). |

## Cambios importantes durante el desarrollo

1. **De juego "en tiempo real" a turnos.** Una primera idea era movimiento
   simultáneo en tiempo real; se abandonó por la complejidad de autoridad del
   servidor y la dificultad de testear. El modo por turnos hace la lógica y las
   pruebas E2E deterministas y fáciles de defender.
2. **Meteorito → cometa.** Se afinó la mecánica para que el evento ambiental
   dañe naves y cristales, aumentando la variabilidad y el dinamismo visual.
3. **Reunir separado de mover… y vuelto a combinar.** Inicialmente moverse
   sobre un cristal lo recogía; se separó en la acción **Reunir** para dar peso a
   la decisión. Tras jugar, los cristales resultaban casi imposibles de
   recolectar, y mover sobre un cristal volvió a recogerlo automáticamente.
   Decisión final sobre la economía de energía:
   - **Mover** sobre un cristal lo **recolecta al pasar** (+12⚡).
   - La deriva de cristales es **suave** (≈35% por turno).
   - La acción **Reunir** se rediseñó como "imán": recoge de una vez todos los
     cristales de la celda propia y las 4 adyacentes (+12⚡ cada uno), dándole un
     propósito claro (acumular sin mover la nave) y conservando las 5 acciones.
4. **Puerto configurable y E2E reutilizable.** Se detectó en la máquina de
   desarrollo que el puerto 3000 estaba ocupado por otro proyecto; se parametrizó
   `PORT/BASE_URL/VITE_PROXY_TARGET` para las pruebas locales contra producción.
5. **Adaptación a las reglas de ESLint 10 de React Hooks.** La animación del
   proyectil se reescribió para actualizar estado solo dentro del callback del
   intervalo, respetando la regla `react-hooks/set-state-in-effect`.

## Aprendizajes / notas

- El monorepo con workspaces simplifica el despliegue, pero exige revisar que el
  ESLint de un paquete CommonJS use `eslint.config.mjs`.
- TypeScript 6 deprecó `moduleResolution: node`; el servidor usa `node16`.