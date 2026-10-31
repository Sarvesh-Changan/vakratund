import { describe, expect, it } from "vitest";
import { explainEstimate } from "./explain";
import type { EstimatorConfig } from "./types";

const config: EstimatorConfig = { serviceId: "x", slug: "x", name: "x", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 2000, minCharge: 25000, minArea: 1, maxArea: 5000, spreadPercent: 10, roundTo: 1, version: 1, fields: [{ key: "area", label: "Area", type: "NUMBER", required: true, sortOrder: 0, min: 1, max: 5000, effectType: "NONE", effectValue: null, options: [] }], rules: [], locationZones: [] };

describe("explainEstimate", () => {
  it("uses the engine result and explains its totals", () => {
    const explanation = explainEstimate(config, { area: 1200 });
    expect(explanation.result.low).toBe(2_160_000);
    expect(explanation.result.high).toBe(2_640_000);
    expect(explanation.steps[0]).toContain("1,200 sq ft × ₹2,000 = ₹24,00,000");
    expect(explanation.steps.at(-1)).toContain("₹21,60,000 to ₹26,40,000");
  });
  it("does not invent a price for inspection-first services", () => {
    const explanation = explainEstimate({ ...config, pricingMode: "INSPECTION_ONLY" }, { area: 1200 });
    expect(explanation.result.low).toBeNull();
  });
});
