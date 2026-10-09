import { describe, expect, it } from "vitest";
import { buildConfigHash, buildConfigSnapshot, stableJson } from "./snapshot";
import type { EstimatorConfig } from "./types";

const config: EstimatorConfig = { serviceId: "s", slug: "s", name: "S", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 1, minCharge: 0, minArea: 1, maxArea: 10, spreadPercent: 0, roundTo: 1, version: 1, fields: [], rules: [], locationZones: [] };

describe("estimator snapshots", () => {
  it("sorts object keys while preserving array order", () => expect(stableJson({ b: 1, a: { d: 2, c: 3 }, list: ["b", "a"] })).toBe('{"a":{"c":3,"d":2},"b":1,"list":["b","a"]}'));
  it("creates an equivalent JSON snapshot", () => expect(buildConfigSnapshot(config)).toEqual(config));
  it("produces a stable sha256 hash regardless of object key insertion order", () => {
    const reordered = { ...config, fields: [], rules: [], locationZones: [], name: "S" };
    expect(buildConfigHash(config)).toHaveLength(64);
    expect(buildConfigHash(config)).toBe(buildConfigHash(reordered));
  });
  it("changes the hash when configuration changes", () => expect(buildConfigHash(config)).not.toBe(buildConfigHash({ ...config, version: 2 })));
});
