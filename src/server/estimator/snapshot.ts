import { createHash } from "node:crypto";
import type { EstimatorConfig } from "./types";

export type ConfigSnapshot = EstimatorConfig;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function buildConfigSnapshot(config: EstimatorConfig): ConfigSnapshot {
  return JSON.parse(stableJson(config)) as ConfigSnapshot;
}

export function buildConfigHash(configOrSnapshot: EstimatorConfig | ConfigSnapshot): string {
  return createHash("sha256").update(stableJson(configOrSnapshot)).digest("hex");
}
