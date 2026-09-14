import { defineConfig, devices } from "@playwright/test";

// La URL y el puerto se pueden sobreescribir con BASE_URL y PORT,
// útiles para probar contra producción o si el 3000 está ocupado.
// Ejemplo local (PowerShell): $env:PORT=3210; npm run test:e2e
const port = process.env.PORT ?? "3000";
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`;
const serverEnv = process.env.PORT ? { PORT: process.env.PORT } : undefined;

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL,
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    cwd: "..",
    command: "npm run start:prod",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: serverEnv,
  },
});