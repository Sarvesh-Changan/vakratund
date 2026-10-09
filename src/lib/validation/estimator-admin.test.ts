import { describe, expect, it } from "vitest";
import { estimatorServiceAdminSchema } from "./estimator-admin";

const base = { id: "seed-estimator", isActive: true, pricingMode: "ESTIMATE", unit: "SQFT", baseRate: 100, minCharge: 0, minArea: 100, maxArea: 10000, spreadPercent: 10, roundTo: 100, disclaimer: null, fields: [], rules: [] } as const;

describe("estimator admin validation", () => {
  it("rejects empty rule conditions", () => expect(estimatorServiceAdminSchema.safeParse({ ...base, rules: [{ name: "Broken", order: 0, condition: { all: [] }, effectType: "ADD_FLAT", effectValue: 100, isActive: true }] }).success).toBe(false));
  it("rejects invalid rule operators and unknown keys", () => expect(estimatorServiceAdminSchema.safeParse({ ...base, rules: [{ name: "Broken", order: 0, condition: { all: [{ field: "area", operator: "eval", value: "x" }] }, effectType: "ADD_FLAT", effectValue: 100, isActive: true }] }).success).toBe(false));
  it("rejects inverted area ranges and missing effect values", () => expect(estimatorServiceAdminSchema.safeParse({ ...base, minArea: 1000, maxArea: 100, fields: [{ key: "area", label: "Area", helpText: null, type: "NUMBER", required: true, sortOrder: 0, min: null, max: null, step: null, defaultValue: null, showIf: null, effectType: "ADD_FLAT", effectValue: null, options: [], isActive: true }] }).success).toBe(false));
});
