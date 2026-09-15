# Registro del uso de inteligencia artificial

Se utilizó un asistente de IA (opencode / modelo big-pickle) como apoyo durante
el desarrollo, tal como lo permite el enunciado. La IA colaboró en **dos áreas
concretas**; el resto (decisiones, pruebas, despliegue, video y defensa) es
trabajo del estudiante.

## 1. Redacción de informes

- Redacción asistida de la documentación en `docs/` (reglas, decisiones, API,
  introducción, video y este registro) y del `README.md`.
- El estudiante revisó, completó y ajustó los textos según la rúbrica y sus
  decisiones finales.

## 2. Recomendación e implementación de código

La IA recomendó soluciones **no aplicadas en clase** y las implementó como
propuesta; el estudiante las probó, entendió y las sostendrá en la defensa:

- **Mecánica del juego**: deriva suave de cristales (≈35% por turno) para
  hacerlos alcanzables, recolección automática al mover sobre un cristal y la
  acción **Reunir** como imán de cristales adyacentes.
- **Arquitectura**: monorepo npm con workspaces (`client`, `server`, `e2e`),
  lógica del juego en el servidor con `structuredClone` para no mutar el estado
  original y estado en memoria con historial.
- **Calidad**: suite E2E con Playwright que tolera el "frío" de Render
  (warm-up y reintentos), 3 workflows de GitHub Actions y typecheck aislado por
  workspace.
- **Deploy**: blueprint en `render.yaml` y puertos configurables
  (`PORT`/`BASE_URL`) para probar local y contra producción.

Toda recomendación de código fue decidida y ajustada por el estudiante antes de
quedar en el repositorio.

## Trabajo exclusivo del estudiante

- Elección final de reglas, costos y daños (8⚡ disparo, 10⚡ escudo, +12 reunir,
  +2 pasar, −15/−5).
- Pruebas manuales de la API, de la UI y de las suites E2E (local y en CI).
- Configuración del despliegue (Render, secrets de GitHub) y verificación de la
  URL pública.
- Grabación del video de 3–5 minutos y defensa con la modificación en vivo
  solicitada por el docente.

## Compromisos del estudiante

1. **Saber explicar** las reglas, la arquitectura, la API y el flujo de una
   acción completa (React → `fetch` → Express → estado → render).
2. **Saber modificar** código durante la defensa (p. ej., cambiar un costo de
   energía, agregar una acción o ajustar el tablero) y verlo desplegado.
3. **Saber ejecutar** las pruebas E2E locales y contra producción.
4. **No copiar texto de la IA** sin comprenderlo en la defensa.