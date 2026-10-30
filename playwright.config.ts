import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "on-first-retry" },
  projects: [
    { name: "desktop", testMatch: /services-navigation\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: { command: `npm.cmd run build && node node_modules/next/dist/bin/next start -p ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.CI, timeout: 180_000 },
});
