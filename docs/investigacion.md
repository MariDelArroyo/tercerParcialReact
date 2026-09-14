# 🔬 Investigación técnica: pruebas E2E y publicación

## 1. Herramienta de pruebas E2E: Playwright

### Qué se investigó

- Se compararon **Playwright**, **Cypress** y la alternativa "nativa" de lanzar
  prueba con solo `fetch`. Se eligió **Playwright** porque:
  - Es la herramienta de referencia para múltiples navegadores (Chromium,
    Firefox, WebKit) con un API moderna (`test`, `expect`, `webServer`).
  - Maneja él mismo el ciclo de vida del servidor (`webServer`), ideal para CI.
  - Permite ejecución **headless** en GitHub Actions y **visual con Chrome**
    localmente (`--headed`) para la defensa.
  - Trabaja con el stack TypeScript sin configuración adicional.

### Fuentes consultadas

- Guía oficial de Playwright: https://playwright.dev/docs/intro y
  https://playwright.dev/docs/test-web-server
- Ejemplo del template de la herramienta (`@playwright/test`).
- Guía de GitHub Actions para pruebas: https://playwright.dev/docs/ci-intro
- Documentación de Express para servir estáticos y JSON:
  https://expressjs.com/es/starter/hello-world.html

### Cómo se ejecuta localmente

```bash
# 1) Probar contra la app local (compila y arranca el servidor solo):
npm run test:e2e              # headless (por defecto Chromium)

# 2) Visual con Chrome para la defensa:
npm run test:e2e:headed       # o bien: npx playwright test --headed
```

Si el puerto 3000 está ocupado en la máquina (como ocurrió con otro proyecto en
desarrollo), se cambia el puerto con variables de entorno:

```bash
# PowerShell
$env:PORT=3210; npm run test:e2e

# bash / Git Bash
PORT=3210 npm run test:e2e
```

### Cómo se prueba contra producción (durante la defensa)

La misma suite se puede ejecutar contra la **aplicación publicada** con la
variable `BASE_URL`. De esta forma, la prueba 1 de la defensa ("ejecución E2E en
producción") queda demostrada con el juego ya desplegado:

```bash
# PowerShell
$env:BASE_URL="https://nebula-duel.onrender.com"; npm run test:e2e:headed

# bash
BASE_URL="https://nebula-duel.onrender.com" npm run test:e2e:headed
```

### Lo que cubren las pruebas end-to-end

| Test | Cubre |
| --- | --- |
| `inicio: formulario y creación de partida` | Inicio de la aplicación y creación de partida |
| `formulario vacío muestra error` | Validación (caso límite) visible |
| `mover la nave comunica con el backend y cambia de turno` | Interacción principal + comunicación HTTP real |
| `repetir escudo muestra error de validación` | Acción inválida validada por el servidor |
| `GET devuelve el estado de la partida recién creada` | Comunicación backend (GET) |
| `la partida finaliza al alcanzar el límite de turnos` | Caso de finalización completo |

### Limitaciones encontradas

- En Windows, un puerto ocupado rompe el `webServer`; se resuelve con `PORT`.
- `reuseExistingServer: !CI` requiere tener bien configurado el puerto en cada
  entorno (por eso las variables de entorno).
- El navegador de Playwright hay que instalarlo una vez: `npx playwright install
  chromium` (en CI, `npx playwright install --with-deps chromium`).

## 2. Servicio de publicación: Render

### Qué se eligió y por qué

- **Render** (https://render.com/) se eligió por ser el servicio recomendado en
  el enunciado, con **plan gratuito**, buen soporte para Node y despliegue
  directo desde el repositorio (blueprint `render.yaml` o Web Service).
- **No se usó Docker**: Render permite publicar Node sin contenedor. Se documenta
  aquí esa decisión; Docker queda como mejora opcional (ver README).

### Configuración del servicio

- **Tipo**: Web Service (runtime `node`, plan `free`).
- **Build**: `npm install && npm run build`
- **Start**: `npm start` (arranca `server/dist/index.js`)
- **Puerto**: Render inyecta la variable `PORT` automáticamente; el servidor la
  respeta (`process.env.PORT`), por defecto `3000` si no está definida. No hace
  falta fijar puerto manualmente.
- **Healthcheck**: `GET /api/health` (configurado en `render.yaml`).

### Despliegue automático con GitHub Actions

El workflow `deploy.yml` compila la aplicación y luego **llama al Deploy Hook** de
Render. Pasos de configuración única:

1. Crear la cuenta y el Web Service en Render apuntando al repositorio
   (ramas `main`), con el build y start indicados.
2. En el panel del servicio: **Settings → Deploy Hooks → Create Hook**.
3. Copiar la URL del hook y agregarla como **secreto de GitHub**:
   - `RENDER_DEPLOY_HOOK_URL` → URL del hook.
   - `RENDER_PUBLIC_URL` → URL pública de la app (para la verificación final).

A partir de entonces, cada push a `main` o un `workflow_dispatch` ejecuta lint →
E2E → deploy y Render reconstruye ypublica la aplicación.

### Variables de entorno usadas

| Variable | Dónde | Uso |
| --- | --- | --- |
| `PORT` | Render (automática) / local | Puerto HTTP del servidor |
| `VITE_PROXY_TARGET` | local (dev) | Destino del proxy de Vite para `/api` |
| `BASE_URL` | Playwright | URL contra la que corren las pruebas E2E |
| `PORT` (Playwright) | local | Puerto del servidor de prueba E2E si el 3000 está ocupado |
| `RENDER_DEPLOY_HOOK_URL` | Secreto de GitHub | Disparar el deploy |
| `RENDER_PUBLIC_URL` | Secreto de GitHub | Verificación post-deploy |

### Verificación del despliegue

```bash
curl https://nebula-duel.onrender.com/api/health   # → {"ok":true}
```

## 3. Docker (decisión)

**No se utilizó Docker** porque Render publica la app completa (frontend + backend)
en el mismo servicio sin contenedor, con la configuración `buildCommand` /
`startCommand`. Si se quisiera usar más adelante, se necesitaría un `Dockerfile`
Node 22 con `npm ci && npm run build` y `CMD ["npm", "start"]` en el puerto `PORT`
que Render inyecta.