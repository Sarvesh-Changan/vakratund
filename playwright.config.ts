import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [{ name: "mobile", use: { ...devices["iPhone 13"] } }],
  webServer: { command: "npm.cmd run build && node node_modules/next/dist/bin/next start", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI, timeout: 180_000 },
});
