import { spawnSync } from "node:child_process";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset the database when NODE_ENV=production.");
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", "migrate", "reset", "--force", "--skip-seed"], {
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
