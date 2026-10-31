import { describe, expect, it } from "vitest";
import { estimatorImpactPreview } from "./impact";
import type { EstimatorConfig } from "../types";

const base: EstimatorConfig = { serviceId: "x", slug: "x", name: "x", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 100, minCharge: 0, minArea: 100, maxArea: 1000, spreadPercent: 0, roundTo: 1, version: 1, fields: [{ key: "area", label: "Area", type: "NUMBER", required: true, sortOrder: 0, min: 100, max: 1000, effectType: "NONE", effectValue: null, options: [] }], rules: [], locationZones: [] };

describe("estimatorImpactPreview", () => {
  it("compares up to six sample ranges and reports price changes", () => {
    const preview = estimatorImpactPreview(base, { ...base, baseRate: 125 });
    expect(preview.length).toBeLessThanOrEqual(6);
    expect(preview[0]?.changed).toBe(true);
    expect(preview[0]?.changePercent).toBe(25);
  });
});
