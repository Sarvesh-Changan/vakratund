import { describe, expect, it } from "vitest";
import { groupBreakdown, initialAnswers, selectedLabel } from "./presentation";
import type { EstimatorConfig, Field } from "./types";

const field: Field = { key: "area", label: "Project area", shortHelp: "", type: "NUMBER", required: true, isAdvanced: false, sortOrder: 0, min: 100, max: 1000, step: 100, defaultValue: "600", presetValues: [600, 800], unitLabel: "sq ft", options: [], effectType: "NONE", effectValue: null };
const config: EstimatorConfig = { serviceId: "service", slug: "building", name: "Building Construction", description: null, includedText: [], notIncludedText: [], pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 100, minCharge: 0, minArea: 100, maxArea: 1000, spreadPercent: 10, roundTo: 100, disclaimer: null, version: 1, fields: [field], rules: [], locationZones: [] };

describe("estimator presentation", () => {
  it("groups detailed items without changing their total", () => {
    const items = [
      { id: "base", label: "Base estimate", kind: "BASE" as const, amount: 500 },
      { id: "option-premium", label: "Premium", kind: "ADD_FLAT" as const, amount: 100 },
      { id: "location-thane", label: "Thane", kind: "LOCATION" as const, amount: 50 },
      { id: "minimum-charge", label: "Minimum charge adjustment", kind: "MINIMUM" as const, amount: 25 },
    ];
    const groups = groupBreakdown(items);
    expect(groups.map((group) => group.label)).toEqual(["Work cost", "Extras", "Location adjustment", "Other adjustments"]);
    expect(groups.reduce((sum, group) => sum + group.amount, 0)).toBe(675);
  });

  it("uses configured defaults and never exposes option keys as labels", () => {
    expect(initialAnswers(config).area).toBe(600);
    const choice: Field = { ...field, key: "finish", label: "Finish level", type: "RADIO", defaultValue: null, options: [{ value: "standard", label: "Standard", effectType: "NONE", effectValue: null, sortOrder: 0 }] };
    expect(selectedLabel(choice, "standard")).toBe("Standard");
  });
});
