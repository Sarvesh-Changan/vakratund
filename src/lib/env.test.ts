import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { MIN_SECRET_LENGTH, parseEnvironment } from "@/lib/env";

function validSecrets(): { BETTER_AUTH_SECRET: string; IP_HASH_SECRET: string } {
  return { BETTER_AUTH_SECRET: randomBytes(32).toString("base64"), IP_HASH_SECRET: randomBytes(32).toString("base64") };
}

describe("environment secret validation", () => {
  it("rejects missing secrets in development", () => {
    const result = parseEnvironment({ NODE_ENV: "development" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(["BETTER_AUTH_SECRET", "IP_HASH_SECRET"]));
  });

  it("rejects secrets shorter than the minimum", () => {
    const result = parseEnvironment({ NODE_ENV: "development", BETTER_AUTH_SECRET: "x".repeat(MIN_SECRET_LENGTH - 1), IP_HASH_SECRET: "y".repeat(MIN_SECRET_LENGTH) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "BETTER_AUTH_SECRET")).toBe(true);
  });

  it("rejects known placeholder patterns", () => {
    const result = parseEnvironment({ NODE_ENV: "development", BETTER_AUTH_SECRET: "build-placeholder-value".padEnd(MIN_SECRET_LENGTH, "x"), IP_HASH_SECRET: "y".repeat(MIN_SECRET_LENGTH) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "BETTER_AUTH_SECRET")).toBe(true);
  });

  it("rejects identical secrets", () => {
    const same = randomBytes(32).toString("base64");
    const result = parseEnvironment({ NODE_ENV: "development", BETTER_AUTH_SECRET: same, IP_HASH_SECRET: same });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.filter((issue) => issue.message.includes("must be different")).length).toBe(2);
  });

  it("accepts two distinct strong secrets", () => {
    const result = parseEnvironment({ NODE_ENV: "development", ...validSecrets() });
    expect(result.success).toBe(true);
  });

  it("allows validation to be skipped only for the explicit production build phase", () => {
    expect(parseEnvironment({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build", SKIP_ENV_VALIDATION: "1" }).success).toBe(true);
    expect(parseEnvironment({ NODE_ENV: "production", SKIP_ENV_VALIDATION: "1" }).success).toBe(false);
  });

  it("requires SMTP configuration in production and accepts matching Gmail sender settings", () => {
    const result = parseEnvironment({ NODE_ENV: "production", DATABASE_URL: "postgres://db", ...validSecrets(), SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "587", SMTP_SECURE: "false", SMTP_USER: "sender@example.com", SMTP_PASS: "app-password", EMAIL_FROM: "Vakratund <sender@example.com>", LEAD_NOTIFY_TO: "notify@example.com, second@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched EMAIL_FROM and SMTP_USER", () => {
    const result = parseEnvironment({ NODE_ENV: "production", DATABASE_URL: "postgres://db", ...validSecrets(), SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "587", SMTP_SECURE: "false", SMTP_USER: "sender@example.com", SMTP_PASS: "app-password", EMAIL_FROM: "other@example.com", LEAD_NOTIFY_TO: "notify@example.com" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "EMAIL_FROM")).toBe(true);
  });
});

