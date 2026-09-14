import { test, expect } from "@playwright/test";

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
): Promise<{ state: { status: string; turn: number } }> {
  return page.evaluate(async (id) => {
    const res = await fetch(`/api/games/${id as string}`);
    return res.json();
  }, gameId) as Promise<{ state: { status: string; turn: number } }>;
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

  const response = await page.evaluate(async (gameId) => {
    const res = await fetch(`/api/games/${gameId as string}`);
    const data = await res.json();
    return data.state;
  }, id);

  expect(response.players[0].name).toBe("Ana");
  expect(response.players[1].name).toBe("Beto");
  expect(response.status).toBe("playing");
  expect(response.maxTurns).toBe(60);
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
    const res = await page.evaluate(
      async (args) => {
        const r = await fetch(`/api/games/${args.id}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player: args.turn,
            action: { type: "pass" },
          }),
        });
        return r.ok;
      },
      { id: gameId, turn: (i % 2) + 1 },
    );
    if (!res) {
      break;
    }
  }

  const before = await fetchState(page, gameId);

  if (before.state.status === "playing") {
    // Turno 59 por UI (Ana), el turno mostrado coincide con el servidor.
    await page.getByTestId("btn-pasar").click();
    await expect(page.getByTestId("turno")).toContainText(/Beto/);

    // Turno 60 por UI (Beto) → finaliza la partida.
    await page.getByTestId("btn-pasar").click();
  }

  await expect(page.getByTestId("resultado")).toBeVisible();

  const after = await fetchState(page, gameId);
  expect(after.state.status).toBe("finished");
});