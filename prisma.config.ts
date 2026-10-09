import { defineConfig, env } from "prisma/config";

import {
  loadStandaloneEnv,
  printEnvironmentLoadError,
} from "./src/lib/standalone-env.ts";

try {
  loadStandaloneEnv();
} catch (error) {
  printEnvironmentLoadError(error);
  throw error;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --no-warnings=ExperimentalWarning --experimental-strip-types prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
