import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), findMany: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (callback: () => unknown) => callback }));
vi.mock("@/lib/db/client", () => ({ prisma: { estimatorService: { findFirst: mocks.findFirst }, locationZone: { findMany: mocks.findMany } } }));

import { getEstimatorConfig } from "./load-config";

describe("getEstimatorConfig", () => {
  beforeEach(() => { mocks.findFirst.mockReset(); mocks.findMany.mockReset(); });

  it("returns null when the requested service is not active or missing", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(getEstimatorConfig("missing")).resolves.toBeNull();
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "missing", isActive: true } }));
  });

  it("maps active database rows and ignores malformed rules", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "estimator-1", slug: "building", name: "Building", description: "Description", pricingMode: "ESTIMATE", unit: "SQFT", baseRate: "123.45", minCharge: "5000", minArea: 100, maxArea: 100000, spreadPercent: "10", roundTo: 100, disclaimer: "Indicative", version: 3,
      fields: [{ key: "area", label: "Area", helpText: null, type: "NUMBER", required: true, sortOrder: 0, min: 100, max: 100000, step: 100, defaultValue: null, showIf: null, effectType: "NONE", effectValue: null, options: [{ value: "one", label: "One", description: null, effectType: "ADD_FLAT", effectValue: "100", sortOrder: 0, isActive: true }] }],
      rules: [{ id: "rule-1", name: "Premium", order: 1, condition: { field: "area", gte: 1000 }, effectType: "ADD_FLAT", effectValue: "500", isActive: true }, { id: "bad", name: "Bad", order: 2, condition: { dangerous: "code" }, effectType: "ADD_FLAT", effectValue: "1", isActive: true }],
    });
    mocks.findMany.mockResolvedValue([{ id: "zone-1", name: "Thane", keywords: ["thane"], multiplierPct: "5", sortOrder: 0, isActive: true }]);
    const result = await getEstimatorConfig("building");
    expect(result).toMatchObject({ serviceId: "estimator-1", baseRate: 123.45, minCharge: 5000, spreadPercent: 10, version: 3 });
    expect(result?.fields[0]?.options[0]?.effectValue).toBe(100);
    expect(result?.rules).toHaveLength(1);
    expect(result?.locationZones[0]?.multiplierPct).toBe(5);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true } }));
  });
});
