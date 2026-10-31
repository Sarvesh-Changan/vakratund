import { describe, expect, it } from "vitest";
import { calculateEstimate } from "./calculate";
import { normalizeEstimatorConfig } from "./normalize";
import type { Answers, EstimatorConfig } from "./types";

function config(seed: number): EstimatorConfig {
  return { serviceId: `s${seed}`, slug: `s${seed}`, name: "Seed sample", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: seed * 7, minCharge: seed * 3, minArea: 1, maxArea: 2000, spreadPercent: seed % 15, roundTo: 10, version: 1, fields: [{ key: "area", label: "Area", type: "NUMBER", required: true, sortOrder: 0, min: 1, max: 2000, effectType: "NONE", effectValue: seed, options: [] }, { key: "choice", label: "Choice", type: "SELECT", required: true, sortOrder: 1, min: null, max: null, effectType: "NONE", effectValue: seed, options: [{ value: "a", label: "A", effectType: "ADD_PER_UNIT", effectValue: seed, sortOrder: 0 }, { value: "b", label: "B", effectType: "NONE", effectValue: seed, sortOrder: 1 }] }], rules: [{ id: "empty", name: "Empty", order: 0, condition: { all: [] }, effectType: "ADD_FLAT", effectValue: seed }], locationZones: [] };
}

describe("normalizeEstimatorConfig", () => {
  it("never changes estimates across generated configurations and answers", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const source = config(seed);
      for (let area = 1; area <= 2000; area += 137) {
        const answers: Answers = { area, choice: area % 2 ? "a" : "b" };
        expect(calculateEstimate(normalizeEstimatorConfig(source), answers)).toEqual(calculateEstimate(source, answers));
      }
    }
  });
});
