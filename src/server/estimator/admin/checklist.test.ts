import { describe, expect, it } from "vitest";
import { estimatorChecklist } from "./checklist";
import type { EstimatorConfig } from "../types";

const config: EstimatorConfig = { serviceId: "x", slug: "x", name: "x", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 10, minCharge: 0, minArea: 1, maxArea: 1000, spreadPercent: 10, roundTo: 100, version: 1, disclaimer: "Indicative only", fields: [{ key: "area", label: "Area", type: "NUMBER", required: true, sortOrder: 0, min: 1, max: 1000, effectType: "NONE", effectValue: null, options: [] }], rules: [], locationZones: [] };

describe("estimatorChecklist", () => {
  it("flags impossible limits and duplicate labels as fixes", () => {
    const items = estimatorChecklist({ ...config, minArea: 1000, maxArea: 1, fields: [{ ...config.fields[0]!, label: "Same" }, { ...config.fields[0]!, key: "other", label: "Same" }] });
    expect(items.find((item) => item.title === "Area limits")?.status).toBe("fix");
    expect(items.find((item) => item.title === "Unique labels")?.status).toBe("fix");
  });
});
