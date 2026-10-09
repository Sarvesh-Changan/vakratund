import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resetEnv } from "@next/env";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  printValidationFailure,
  loadStandaloneEnv,
  validateStandaloneEnvironment,
} from "./standalone-env";

const originalEnvironment = { ...process.env };

afterEach(() => {
  resetEnv();
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, originalEnvironment);
  vi.restoreAllMocks();
});

describe("standalone environment loading", () => {
  it("lets .env.local override .env", () => {
    const directory = mkdtempSync(join(tmpdir(), "vakratund-env-"));
    const key = "VAKRATUND_ENV_LOADER_TEST";
    try {
      Object.assign(process.env, { NODE_ENV: "development" });
      writeFileSync(join(directory, ".env"), `${key}=from-base\n`, "utf8");
      writeFileSync(
        join(directory, ".env.local"),
        `${key}=from-local\n`,
        "utf8",
      );

      const result = loadStandaloneEnv({ directory, announce: false });

      expect(result.environment[key]).toBe("from-local");
      expect(result.files).toEqual(
        expect.arrayContaining([
          { name: ".env", variableCount: 1 },
          { name: ".env.local", variableCount: 1 },
        ]),
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("reports failed variable names and safe reasons without values", () => {
    const secret = "actual-looking-secret-value";
    const result = validateStandaloneEnvironment({
      NODE_ENV: "development",
      BETTER_AUTH_SECRET: secret,
      IP_HASH_SECRET: "different-but-too-short",
      SEED_ADMIN_EMAIL: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    printValidationFailure(result.error);
    const output = error.mock.calls.flat().join("\n");

    expect(output).toContain("BETTER_AUTH_SECRET");
    expect(output).toContain("IP_HASH_SECRET");
    expect(output).toContain("SEED_ADMIN_EMAIL");
    expect(output).toContain("too short");
    expect(output).toContain("invalid email");
    expect(output).not.toContain(secret);
  });
});
