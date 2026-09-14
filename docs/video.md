# 🎬 Video del proyecto (3–5 minutos)

El video es un entregable **grabado por el estudiante** con una herramienta de
captura de pantalla (OBS, Xbox Game Bar o similar). Este documento es un **guion**
sugerido de 4 minutos.

## Guion sugerido (≈4 min)

| Tiempo | Sección | Qué mostrar / decir |
| --- | --- | --- |
| 0:00 – 0:30 | Presentación | Nombre del juego, cómo se juega en una frase, por qué la idea (duelo táctico por turnos, original). |
| 0:30 – 1:20 | **Una partida en el navegador** | Crear la partida (nombres), mover sobre un cristal para recolectarlo (aparece el +12⚡ en el registro), usar el botón **Reunir** para recoger los cristales adyacentes, disparar, escudo, ver el cometa, ver barras y registro, llegar al final (ganador/empate). |
| 1:20 – 1:55 | **Una solicitud JSON** | Abrir DevTools → Network, hacer una acción y mostrar la petición `POST /api/games/:id/actions` con su body JSON y la respuesta JSON. |
| 1:55 – 2:30 | **Prueba E2E en Chrome (visual)** | `npm run test:e2e:headed` contra la app local O contra la URL publicada (ver docs/investigacion.md). |
| 2:30 – 3:30 | **GitHub Actions** | Abrir el repositorio → Actions → mostrar las tres ejecuciones: Lint, E2E Playwright y Deploy, con los checks en verde. |
| 3:30 – 4:00 | **Aplicación publicada** | Mostrar la URL pública (Render), jugar una acción, mostrar `api/health` en el navegador y despedida. |

## Notas

- Mantener el audio claro y el micrófono despejado.
- Evitar mostar secretos o la URL del Deploy Hook al grabar.
- Guardar el video en un lugar accesible y subirlo a Google Drive / YouTube
  (enlace al repositorio o en el README si se solicita).