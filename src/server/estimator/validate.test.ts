import { describe, expect, it } from "vitest";
import { validateAnswers } from "./validate";
import type { Answers, EstimatorConfig } from "./types";

const baseConfig: EstimatorConfig = {
  serviceId: "s", slug: "s", name: "Service", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 10, minCharge: 0, minArea: 100, maxArea: 1000, spreadPercent: 10, roundTo: 100, version: 1,
  fields: [
    { key: "area", label: "Area", type: "NUMBER", required: true, sortOrder: 0, min: 100, max: 1000, effectType: "NONE", effectValue: null, options: [] },
    { key: "kind", label: "Kind", type: "SELECT", required: true, sortOrder: 1, min: null, max: null, effectType: "NONE", effectValue: null, options: [{ value: "a", label: "A", effectType: "NONE", effectValue: null, sortOrder: 0 }, { value: "inactive", label: "Inactive", effectType: "NONE", effectValue: null, sortOrder: 1, isActive: false }] },
    { key: "count", label: "Count", type: "NUMBER", required: false, sortOrder: 2, min: 1, max: 5, effectType: "NONE", effectValue: null, options: [] },
    { key: "enabled", label: "Enabled", type: "BOOLEAN", required: false, sortOrder: 3, min: null, max: null, effectType: "NONE", effectValue: null, options: [] },
    { key: "conditional", label: "Conditional", type: "SELECT", required: true, sortOrder: 4, min: null, max: null, showIf: { field: "enabled", equals: true }, effectType: "NONE", effectValue: null, options: [{ value: "yes", label: "Yes", effectType: "NONE", effectValue: null, sortOrder: 0 }] },
    { key: "multi", label: "Multi", type: "MULTISELECT", required: false, sortOrder: 5, min: null, max: null, effectType: "NONE", effectValue: null, options: [{ value: "x", label: "X", effectType: "NONE", effectValue: null, sortOrder: 0 }, { value: "y", label: "Y", effectType: "NONE", effectValue: null, sortOrder: 1 }] },
  ], rules: [], locationZones: [],
};

const valid: Answers = { area: 100, kind: "a", count: 2, enabled: false, multi: [] };

describe("validateAnswers", () => {
  it.each([
    ["area below minimum", { ...valid, area: 99 }, "MIN"],
    ["area above maximum", { ...valid, area: 1001 }, "MAX"],
    ["missing required field", { ...valid, kind: "" }, "REQUIRED"],
    ["number has wrong type", { ...valid, count: "2" }, "TYPE"],
    ["number below field minimum", { ...valid, count: 0 }, "MIN"],
    ["number above field maximum", { ...valid, count: 6 }, "MAX"],
    ["invalid option", { ...valid, kind: "missing" }, "OPTION"],
    ["inactive option", { ...valid, kind: "inactive" }, "OPTION"],
    ["multiselect has wrong type", { ...valid, multi: "x" }, "TYPE"],
    ["multiselect has unknown value", { ...valid, multi: ["z"] }, "OPTION"],
    ["multiselect has duplicate values", { ...valid, multi: ["x", "x"] }, "DUPLICATE"],
    ["unknown answer key", { ...valid, other: true }, "UNKNOWN_FIELD"],
    ["boolean has wrong type", { ...valid, enabled: "true" }, "TYPE"],
  ])("rejects %s", (_name, input, code) => {
    const result = validateAnswers(baseConfig, input);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain(code);
  });

  it("accepts a valid answer set", () => expect(validateAnswers(baseConfig, valid)).toEqual({ valid: true, errors: [] }));
  it("ignores a required field hidden by showIf", () => expect(validateAnswers(baseConfig, valid).errors).not.toContainEqual(expect.objectContaining({ field: "conditional" })));
  it("requires a conditional field when it becomes visible", () => {
    const result = validateAnswers(baseConfig, { ...valid, enabled: true });
    expect(result.errors).toContainEqual(expect.objectContaining({ field: "conditional", code: "REQUIRED" }));
  });
  it("checks custom config area limits even when the area field has wider limits", () => {
    const result = validateAnswers({ ...baseConfig, minArea: 200 }, valid);
    expect(result.errors).toContainEqual(expect.objectContaining({ field: "area", code: "MIN" }));
  });
});
