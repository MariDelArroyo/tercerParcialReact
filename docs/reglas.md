# 📖 Reglas y diseño del juego

## Cantidad y tipo de jugadores

- **2 jugadores** en el mismo dispositivo, por turnos alternados (hot seat).
- Un jugador controla la nave 🚀 (id 1) y el otro la 👾 (id 2).
- Los turnos **nunca comparten el control**: solo puede actuar el jugador cuyo
  turno indica el servidor.

## Tablero y estado

- Tablero de **10 columnas × 8 filas** (80 celdas), ocupando toda el área de
  juego en pantalla.
- Cada jugador tiene: **posición** (x, y), **casco** (vida, empieza en 100) y
  **energía** (empieza en 20, máximo 30).
- En el tablero hay **5 cristales** 💠 en posiciones aleatorias que **derivan**
  de forma suave: cada cristal se mueve una celda al azar solo en parte del paso
  ambiental (≈35% por turno) y desaparece tras una edad máxima (variabilidad).
- Cada 4 turnos entra un **cometa** ☄️ en un borde aleatorio, **cruza el tablero**
  una casilla por turno, daña naves (−12 de casco) y destruye cristales
  (variabilidad y elementos en movimiento).

## Acciones válidas (una por turno)

| Acción | Costo | Efecto |
| --- | --- | --- |
| **Mover** | 0⚡ | Desplaza la nave 1 celda (arriba/abajo/izquierda/derecha). No se puede salir del tablero ni entrar a la celda del rival. Si la nave termina sobre un cristal, lo **recolecta automáticamente** (+12⚡). |
| **Reunir** | 0⚡ | Si la nave inicia el turno sobre un cristal, gana **+12⚡** sin gastar el movimiento. |
| **Disparar** | 8⚡ | Lanza un rayo en línea recta (una de las 4 direcciones). Recorre la fila/columna; los **cristales bloquean** el rayo. Golpea a la nave rival si está en la misma línea. |
| **Escudo** | 10⚡ | Activa un escudo por hasta 2 turnos propios. Reduce el próximo disparo recibido a **−5** de casco y consume el escudo. No se puede activar con otro escudo activo. |
| **Pasar** | 0⚡ | No hace nada más que sumar **+2⚡** y ceder el turno. |

**Daño de disparo sin escudo: −15 de casco.**

## Elementos que se mueven

1. **Cristales**: derivan una celda al azar con ≈35% de probabilidad por paso
   ambiental (deriva suave que los hace alcanzables).
2. **Cometa**: aparece en un borde aleatorio cada 4 turnos y avanza una celda por
   turno hasta salir del tablero.
3. **Rayos**: el proyectil se muestra recorriendo la línea de tiro antes de
   resolver el impacto (animación en el cliente guiada por la trayectoria que
   devuelve el servidor).
4. **Naves**: cambian de posición al moverse.

## Interacción entre jugadores

- **Ataque directo**: disparar reduce el casco del rival; el escudo lo mitiga.
- **Competencia por recursos**: la energía viaja en cristales y **no se
  regenera sola salvo con pases**; ambos jugadores compiten por los mismos 5
  cristales en un tablero en movimiento.
- **Bloqueo**: los cristales bloquean rayos, de modo que el jugador puede
  "protegerse" situando un cristal en su línea o elegir trayectorias libres.
- **Ocupación de celdas**: las naves no pueden ocupar la misma celda.

## Decisiones estratégicas

El jugador debe decidir entre alternativas con consecuencias diferentes:

- **Disparar pronto** gasta 8⚡ pero daña al rival; si el rayo queda bloqueado, la
  energía se pierde igual.
- **Reunir** acelera la economía: la forma más sencilla es **moverse sobre un
  cristal** (se recolecta al pasar); la acción **Reunir** se reserva para los
  cristales que derivan y quedan bajo la nave.
- **Moverse** cambia la línea de tiro, acerca al rival y permite cazar cristales.
- **Pasar** es la opción segura: recupera un poco de energía sin riesgo.

## Acciones inválidas (casos límite)

El backend rechaza con `400` y un mensaje claro (visible en pantalla):

- Formulario de inicio con **nombres vacíos**.
- Actuar cuando **no es tu turno**.
- **Moverse fuera del tablero** o **sobre la celda del rival**.
- **Reunir sin cristal** en la celda.
- **Disparar sin energía** (menos de 8⚡).
- **Activar escudo ya activo** o sin energía suficiente.
- Enviar acciones de un **tipo o dirección inválidos**.
- Actuar en una **partida ya terminada**.

## Condición de victoria, empate y finalización

- **Victoria**: un jugador reduce el casco del rival a 0.
- **Límite de turnos**: tras 60 acciones, gana quien tenga más casco.
- **Empate**: igualdad de casco al llegar al límite de turnos.
- Al finalizar, el servidor guarda la partida en el **historial** disponible en
  `GET /api/games` y la pantalla muestra el resultado.

## Retroalimentación visual

- Barras de **casco** (roja) y **energía** (amarilla) por jugador, con valores
  numéricos.
- Indicador de **turno**, contador de turnos y resaltado dorado de la nave activa.
- **Registro de mensajes** con lo ocurrido en cada turno.
- **Avisos de error** claros para acciones inválidas.
- **Animación** del rayo y del cometa en el tablero.
- Pantalla **final** con ganador/empate, cascos finales e historial.