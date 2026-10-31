import { describe, expect, it } from "vitest";
import { estimatorConfigChanged, locationZoneConfigChanged, type StoredEstimatorService } from "./changes";
import type { EstimatorServiceAdminInput } from "@/lib/validation/estimator-admin";

const input: EstimatorServiceAdminInput = { id: "x", isActive: false, pricingMode: "ESTIMATE", unit: "SQFT", baseRate: 100, minCharge: 0, minArea: 100, maxArea: 1000, spreadPercent: 10, roundTo: 100, sortOrder: 0, disclaimer: "Only an estimate", includedText: [], notIncludedText: [], fields: [], rules: [] };
const stored: StoredEstimatorService = { name: "Service", description: null, isActive: false, pricingMode: "ESTIMATE", unit: "SQFT", baseRate: "100", minCharge: "0", minArea: 100, maxArea: 1000, spreadPercent: "10", roundTo: 100, sortOrder: 0, disclaimer: "Only an estimate", includedText: [], notIncludedText: [], fields: [], rules: [] };

describe("estimatorConfigChanged", () => {
  it("does not bump a version for an unchanged service", () => { expect(estimatorConfigChanged(stored, input)).toBe(false); });
  it("detects an actual price change", () => { expect(estimatorConfigChanged(stored, { ...input, baseRate: 120 })).toBe(true); });
  it("does not treat an unchanged location surcharge list as a change", () => { expect(locationZoneConfigChanged([{ id: "z", name: "Thane", keywords: ["thane"], multiplierPct: "5", sortOrder: 0, isActive: true }], [{ id: "z", name: "Thane", keywords: ["thane"], multiplierPct: 5, sortOrder: 0, isActive: true }])).toBe(false); });
});
