import nextEnv from "@next/env";
import type { LoadedEnvFiles } from "@next/env";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

import { formatEnvironmentIssues, parseEnvironment } from "./env.ts";

const { loadEnvConfig } = nextEnv;

const LOCAL_ENCODING_MESSAGE = "re-save .env.local as UTF-8";

export class EnvironmentFileEncodingError extends Error {
  constructor() {
    super(LOCAL_ENCODING_MESSAGE);
    this.name = "EnvironmentFileEncodingError";
  }
}

export type EnvFileReport = {
  name: string;
  variableCount: number;
};

export type StandaloneEnvResult = {
  environment: Record<string, string | undefined>;
  files: EnvFileReport[];
};

function modeForProcess(): "development" | "production" | "test" {
  if (process.env.NODE_ENV === "test") return "test";
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function candidateNames(): string[] {
  const mode = modeForProcess();
  return [
    ...new Set(
      [
        `.env.${mode}.local`,
        mode === "test" ? undefined : ".env.local",
        `.env.${mode}`,
        ".env",
      ].filter((name): name is string => Boolean(name)),
    ),
  ];
}

function assignmentCount(contents: Buffer): number {
  const text = contents.toString("utf8");
  return [...text.matchAll(/^\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=/gm)]
    .length;
}

function isUtf16OrBom(contents: Buffer): boolean {
  const hasBom =
    contents.subarray(0, 2).equals(Buffer.from([0xff, 0xfe])) ||
    contents.subarray(0, 2).equals(Buffer.from([0xfe, 0xff])) ||
    contents.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]));
  if (hasBom) return true;
  const sample = contents.subarray(0, Math.min(contents.length, 256));
  let zeroBytes = 0;
  for (const byte of sample) if (byte === 0) zeroBytes += 1;
  return zeroBytes >= 2 && zeroBytes / Math.max(sample.length, 1) > 0.15;
}

function inspectFiles(directory: string): {
  reports: EnvFileReport[];
  invalidLocal: boolean;
} {
  const reports: EnvFileReport[] = [];
  let invalidLocal = false;
  for (const name of candidateNames()) {
    const path = join(directory, name);
    if (!existsSync(path)) continue;
    const contents = readFileSync(path);
    reports.push({ name, variableCount: assignmentCount(contents) });
    if (name.endsWith(".local") && isUtf16OrBom(contents)) invalidLocal = true;
  }
  return { reports, invalidLocal };
}

function printReports(reports: EnvFileReport[]): void {
  if (reports.length === 0) {
    console.log("env files found: none");
    return;
  }
  console.log("env files found:");
  for (const report of reports)
    console.log(`- ${report.name}: ${report.variableCount} variables`);
}

export function loadStandaloneEnv(
  options: { directory?: string; announce?: boolean } = {},
): StandaloneEnvResult {
  const directory = options.directory ?? process.cwd();
  const inspected = inspectFiles(directory);
  if (options.announce !== false) printReports(inspected.reports);
  if (inspected.invalidLocal) throw new EnvironmentFileEncodingError();

  const loaded = loadEnvConfig(
    directory,
    modeForProcess() !== "production",
    { info: () => undefined, error: () => undefined },
    true,
  );
  return {
    environment: loaded.combinedEnv,
    files: reportsFromLoadedFiles(loaded.loadedEnvFiles, inspected.reports),
  };
}

function reportsFromLoadedFiles(
  loadedFiles: LoadedEnvFiles,
  inspected: EnvFileReport[],
): EnvFileReport[] {
  if (inspected.length > 0) return inspected;
  return loadedFiles.map((file) => ({
    name: file.path,
    variableCount: Object.keys(file.env).length,
  }));
}

export function printEnvironmentLoadError(error: unknown): void {
  if (error instanceof EnvironmentFileEncodingError) {
    console.error(`Environment file error: ${LOCAL_ENCODING_MESSAGE}.`);
    return;
  }
  console.error("Environment file error: could not load environment files.");
}

function issueReason(issue: z.ZodIssue): string {
  const message = issue.message.toLowerCase();
  if (message.includes("required") || message.includes("received undefined"))
    return "missing";
  if (message.includes("at least") || message.includes("too small"))
    return "too short";
  if (message.includes("placeholder")) return "placeholder";
  if (message.includes("must be different") || message.includes("identical"))
    return "identical secrets";
  if (message.includes("email") || message.includes("e-mail"))
    return "invalid email";
  return "invalid value";
}

export function printValidationFailure(
  error: z.ZodError,
  fallbackName?: string,
): void {
  const messages = new Map<string, Set<string>>();
  for (const issue of error.issues) {
    const name = String(issue.path[0] ?? fallbackName ?? "environment");
    const reasons = messages.get(name) ?? new Set<string>();
    reasons.add(issueReason(issue));
    messages.set(name, reasons);
  }
  console.error("Environment validation failed:");
  for (const [name, reasons] of messages)
    console.error(`- ${name}: ${[...reasons].join(", ")}`);
}

export function validateStandaloneEnvironment(
  environment: Record<string, string | undefined>,
): ReturnType<typeof parseEnvironment> {
  return parseEnvironment(environment);
}

export { formatEnvironmentIssues };
