import { describe, expect, it } from "vitest";
import { calculateEstimate } from "./calculate";
import type { EstimatorConfig } from "./types";

function config(overrides: Partial<EstimatorConfig> = {}): EstimatorConfig {
  return {
    serviceId: "service-1", slug: "test-service", name: "Test service", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 100, minCharge: 0, minArea: 100, maxArea: 100_000, spreadPercent: 10, roundTo: 100, version: 1,
    fields: [
      { key: "area", label: "Area", type: "NUMBER", required: true, sortOrder: 0, min: 100, max: 100_000, effectType: "NONE", effectValue: null, options: [] },
      { key: "location", label: "Location", type: "SELECT", required: true, sortOrder: 1, min: null, max: null, effectType: "NONE", effectValue: null, options: [{ value: "thane", label: "Thane", effectType: "NONE", effectValue: null, sortOrder: 0 }, { value: "mumbai", label: "Mumbai", effectType: "NONE", effectValue: null, sortOrder: 1 }] },
      { key: "spec", label: "Specification", type: "SELECT", required: false, sortOrder: 2, min: null, max: null, effectType: "NONE", effectValue: null, options: [{ value: "standard", label: "Standard", effectType: "NONE", effectValue: null, sortOrder: 0 }, { value: "premium", label: "Premium", effectType: "NONE", effectValue: null, sortOrder: 1 }] },
      { key: "addons", label: "Add-ons", type: "MULTISELECT", required: false, sortOrder: 3, min: null, max: null, effectType: "NONE", effectValue: null, options: [{ value: "unit", label: "Unit add-on", effectType: "ADD_PER_UNIT", effectValue: 2, sortOrder: 0 }, { value: "flat", label: "Flat add-on", effectType: "ADD_FLAT", effectValue: 500, sortOrder: 1 }, { value: "percent", label: "Percent add-on", effectType: "MULTIPLY_PERCENT", effectValue: 10, sortOrder: 2 }, { value: "inactive", label: "Inactive", effectType: "ADD_FLAT", effectValue: 9999, sortOrder: 3, isActive: false }] },
      { key: "toggle", label: "Toggle", type: "BOOLEAN", required: false, sortOrder: 4, min: null, max: null, effectType: "NONE", effectValue: null, options: [] },
      { key: "hidden", label: "Hidden field", type: "SELECT", required: true, sortOrder: 5, min: null, max: null, showIf: { field: "toggle", equals: true }, effectType: "NONE", effectValue: null, options: [{ value: "yes", label: "Yes", effectType: "NONE", effectValue: null, sortOrder: 0 }] },
    ],
    rules: [
      { id: "rule-flat", name: "Premium specification", order: 1, condition: { field: "spec", equals: "premium" }, effectType: "ADD_FLAT", effectValue: 1000 },
      { id: "rule-percent", name: "Premium complexity", order: 2, condition: { field: "spec", equals: "premium" }, effectType: "MULTIPLY_PERCENT", effectValue: 10 },
    ],
    locationZones: [{ id: "zone-thane", name: "Thane", keywords: ["thane"], multiplierPct: 10, sortOrder: 0 }, { id: "zone-mumbai", name: "Mumbai", keywords: ["mumbai"], multiplierPct: 0, sortOrder: 1 }],
    ...overrides,
  };
}

const answers = { area: 1000, location: "mumbai", spec: "standard", addons: [] as string[], toggle: false };

describe("calculateEstimate", () => {
  it.each([
    ["base amount", answers, 90000, 110000],
    ["empty add-ons", { ...answers, addons: [] }, 90000, 110000],
    ["per-unit add-on", { ...answers, addons: ["unit"] }, 91800, 112200],
    ["flat add-on", { ...answers, addons: ["flat"] }, 90500, 110600],
    ["ordered rule effects", { ...answers, spec: "premium" }, 100000, 122200],
    ["location multiplier", { ...answers, location: "thane" }, 99000, 121000],
    ["percent effects stack", { ...answers, location: "thane", spec: "premium", addons: ["percent"] }, 121000, 147900],
  ])("calculates %s", (_name, input, low, high) => {
    const result = calculateEstimate(config(), input);
    expect(result.low).toBe(low);
    expect(result.high).toBe(high);
  });

  it("uses a SET_BASE_RATE option before the base calculation", () => {
    const next = config({ fields: config().fields.map((field) => field.key === "spec" ? { ...field, options: field.options.map((option) => option.value === "premium" ? { ...option, effectType: "SET_BASE_RATE", effectValue: 200 } : option) } : field) });
    const result = calculateEstimate(next, { ...answers, spec: "premium" });
    expect(result.low).toBe(199000);
    expect(result.high).toBe(243200);
  });

  it("applies minimum charge before spread", () => {
    const result = calculateEstimate(config({ baseRate: 1, minCharge: 5000 }), { ...answers, area: 100 });
    expect(result.low).toBe(4500);
    expect(result.high).toBe(5500);
    expect(result.breakdown.some((item) => item.kind === "MINIMUM")).toBe(true);
  });

  it("rounds low and high to the configured increment", () => {
    const result = calculateEstimate(config({ baseRate: 123.45, spreadPercent: 0, roundTo: 1000 }), answers);
    expect(result.low).toBe(123000);
    expect(result.high).toBe(123000);
  });

  it("handles a very large valid area deterministically", () => {
    const result = calculateEstimate(config({ spreadPercent: 0 }), { ...answers, area: 100_000 });
    expect(result.low).toBe(10_000_000);
    expect(result.high).toBe(10_000_000);
  });

  it("returns no price for inspection-only services", () => {
    const result = calculateEstimate(config({ pricingMode: "INSPECTION_ONLY" }), answers);
    expect(result.low).toBeNull();
    expect(result.high).toBeNull();
    expect(result.warnings).toContain("This service requires a site inspection before pricing.");
  });

  it("ignores hidden fields and their values", () => {
    const result = calculateEstimate(config(), { ...answers, hidden: "yes" });
    expect(result.low).toBe(90000);
    expect(result.warnings).toEqual([]);
  });

  it("returns validation warnings rather than calculating tampered answers", () => {
    const result = calculateEstimate(config(), { ...answers, addons: ["inactive"] });
    expect(result.low).toBeNull();
    expect(result.warnings.join(" ")).toContain("active options");
  });

  it("includes the configured disclaimer in warnings", () => {
    const result = calculateEstimate(config({ disclaimer: "Indicative only." }), answers);
    expect(result.warnings).toEqual(["Indicative only."]);
  });

  it("matches a location by keyword", () => {
    const result = calculateEstimate(config(), { ...answers, location: "thane" });
    expect(result.breakdown.find((item) => item.kind === "LOCATION")?.detail).toBe("10%");
  });
});
