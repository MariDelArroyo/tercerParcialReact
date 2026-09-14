# 🤖 Registro del uso de inteligencia artificial

Se utilizó un asistente de IA (opencode / modelo big-pickle) como **asistente de
desarrollo**, tal como lo permite el enunciado. Este documento registra qué se
hizo, qué revisó y editó el estudiante, para que la defensa quede clara.

## Cómo se trabajó

| Actividad | ¿IA lo hizo? | ¿Estudiante lo revisó? |
| --- | --- | --- |
| Diseño de la idea del juego (turnos, 5 acciones, cristales + cometa) | Propuesta con base en los requisitos | Sí, ajustó reglas y respondió dudas |
| Estructura del repositorio (workspaces, carpetas) | Creación y organización | Sí, comprendió cada carpeta |
| Código del backend (`game.ts`, `index.ts`) | Escritura del código | Sí, probó la API manualmente y la explicará |
| Código del frontend (React, componentes, CSS) | Escritura del código | Sí, probó la UI con Playwright y en navegador |
| Pruebas E2E (Playwright) | Escritura de la suite | Sí, las ejecutó localmente y en CI |
| Workflows de GitHub Actions | Escritura | Sí, configuró secretos y servicios |
| Documentación (`docs/`) | Redacción asistida | Sí, la leyó y completó con sus decisiones |
| Video de 3–5 minutos | **NO** | El estudiante lo graba y lo explica |
| Defensa y modificación solicitada por el docente | **NO** | Acción exclusiva del estudiante |

## Compromisos del estudiante

1. **Saber explicar** las reglas, la arquitectura, la API y el flujo de una
   acción completa (React → `fetch` → Express → estado → render).
2. **Saber modificar** código durante la defensa (p. ej., cambiar un costo de
   energía, agregar una acción o ajustar el tablero) y verlo desplegado.
3. **Saber ejecutar** las pruebas E2E locales y contra producción.
4. **No copiar texto de la IA** sin comprenderlo en la defensa.

## Modificaciones manuales posteriores a la generación asistida

- Elección final de costos/daños (8⚡ disparo, 10⚡ escudo, +12 reunir, +2 pasar, −15/−5).
- Decisión final del sistema de energía: mover sobre un cristal lo recolecta,
  deriva suave de cristales y **Reunir** como "imán" de cristales adyacentes.
- Configuración de puerto variable para pruebas en máquinas con el 3000 ocupado.
- Ajustes de estilo y textos en `docs/` según la rúbrica.