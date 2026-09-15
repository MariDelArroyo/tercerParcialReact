import { test, expect } from "@playwright/test";

const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 1500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test.beforeAll(async () => {
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  for (let i = 0; i < MAX_RETRIES; i += 1) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) {
        return;
      }
    } catch {
      // servidor aún no disponible (cold start de Render)
    }
    await delay(RETRY_DELAY_MS);
  }
});

// ─────────────────────────────────────────────────────────
//  Utilidad: crear una partida esperando la respuesta POST
// ─────────────────────────────────────────────────────────
async function createGameFromUI(
  page: import("@playwright/test").Page,
  player1: string,
  player2: string,
): Promise<void> {
  await page.goto("/");
  await page.getByTestId("input-jugador-1").fill(player1);
  await page.getByTestId("input-jugador-2").fill(player2);
  await page.getByRole("button", { name: "Comenzar partida" }).click();
  await expect(page.getByTestId("turno")).toBeVisible();
}

async function fetchState(
  page: import("@playwright/test").Page,
  gameId: string,
): Promise<{ state?: { status: string; turn: number } } | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const found = await page.evaluate(async (id) => {
      try {
        const res = await fetch(`/api/games/${id as string}`);
        if (!res.ok) {
          return undefined;
        }
        return (await res.json()) as {
          state: { status: string; turn: number };
        };
      } catch {
        return undefined;
      }
    }, gameId);
    if (found !== undefined) {
      return found;
    }
    await delay(RETRY_DELAY_MS * (attempt + 1));
  }
  return null;
}

async function passViaApi(
  page: import("@playwright/test").Page,
  gameId: string,
  player: number,
): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const ok = await page.evaluate(async (args) => {
      try {
        const res = await fetch(`/api/games/${args.id}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player: args.player,
            action: { type: "pass" },
          }),
        });
        return res.ok;
      } catch {
        return false;
      }
    }, { id: gameId, player });
    if (ok) {
      return true;
    }
    await delay(RETRY_DELAY_MS * (attempt + 1));
  }
  return false;
}

// ===========================================================
//  1. Inicio: la pantalla carga y permite crear la partida
// ===========================================================
test("inicio: formulario y creación de partida", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Nébula/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Comenzar partida" }),
  ).toBeVisible();
  await expect(page.getByTestId("input-jugador-1")).toBeVisible();
  await expect(page.getByTestId("input-jugador-2")).toBeVisible();

  await page.getByTestId("input-jugador-1").fill("Ana");
  await page.getByTestId("input-jugador-2").fill("Beto");
  await page.getByRole("button", { name: "Comenzar partida" }).click();

  await expect(page.getByTestId("turno")).toContainText("Turno de Ana");
  await expect(page.getByTestId("tablero")).toBeVisible();
});

// ===========================================================
//  2. Formulario vacío → mensaje de error visible
// ===========================================================
test("formulario vacío muestra error", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Comenzar partida" }).click();
  await expect(page.getByRole("alert")).toContainText(/obligatorios/i);
});

// ===========================================================
//  3. Interacción principal: mover nave con el backend
// ===========================================================
test("mover la nave comunica con el backend y cambia de turno", async ({
  page,
}) => {
  await createGameFromUI(page, "Ana", "Beto");

  const actionResponse = page.waitForResponse(
    (r) =>
      r.url().includes("/api/games/") &&
      r.url().includes("/actions") &&
      r.request().method() === "POST",
  );

  await page.getByTestId("btn-mover").click();
  await page.getByTestId("btn-move-right").click();

  const response = await actionResponse;
  expect(response.ok()).toBeTruthy();

  await expect(page.getByTestId("turno")).toContainText(/Beto/);
});

// ===========================================================
//  4. Acción inválida: repetir el escudo activo
// ===========================================================
test("repetir escudo muestra error de validación", async ({ page }) => {
  await createGameFromUI(page, "Ana", "Beto");

  await page.getByTestId("btn-escudo").click();
  await expect(page.getByTestId("turno")).toContainText(/Beto/);

  await page.getByTestId("btn-pasar").click();
  await expect(page.getByTestId("turno")).toContainText(/Ana/);

  await page.getByTestId("btn-escudo").click();
  await expect(page.getByRole("alert")).toContainText(/escudo activo/i);
});

// ===========================================================
//  5. Comunicación backend: GET devuelve el estado correcto
// ===========================================================
test("GET devuelve el estado de la partida recién creada", async ({
  page,
}) => {
  await createGameFromUI(page, "Ana", "Beto");
  const id = await page.getByTestId("tablero").getAttribute("data-game-id");
  expect(id).toBeTruthy();

  const fetched = await fetchState(page, id as string);
  expect(fetched?.state).toBeDefined();

  const state = fetched?.state as unknown as {
    players: { name: string }[];
    status: string;
    maxTurns: number;
  };
  expect(state.players[0].name).toBe("Ana");
  expect(state.players[1].name).toBe("Beto");
  expect(state.status).toBe("playing");
  expect(state.maxTurns).toBe(60);
});

// ===========================================================
//  6. Finalización: partida termina en el límite de turnos
// ===========================================================
test("la partida finaliza al alcanzar el límite de turnos", async ({
  page,
}) => {
  await createGameFromUI(page, "Ana", "Beto");

  const gameId = await page.getByTestId("tablero").getAttribute("data-game-id");
  expect(gameId).toBeTruthy();

  // 58 pases vía API dejan el turno en 1 (Ana), igual que en la UI.
  for (let i = 0; i < 58; i += 1) {
    const ok = await passViaApi(page, gameId as string, (i % 2) + 1);
    if (!ok) {
      break;
    }
  }

  const before = await fetchState(page, gameId as string);
  expect(before?.state?.status).toBeDefined();

  if (before?.state?.status === "playing") {
    // Turno 59 por UI (Ana), el turno mostrado coincide con el servidor.
    await page.getByTestId("btn-pasar").click();
    await expect(page.getByTestId("turno")).toContainText(/Beto/);

    // Turno 60 por UI (Beto) → finaliza la partida.
    await page.getByTestId("btn-pasar").click();
  }

  await expect(page.getByTestId("resultado")).toBeVisible();

  const after = await fetchState(page, gameId as string);
  expect(after?.state?.status).toBe("finished");
});