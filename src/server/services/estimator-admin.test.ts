import { describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  estimatorService: { findUnique: vi.fn(), update: vi.fn() },
  estimatorField: { deleteMany: vi.fn(), create: vi.fn() },
  fieldOption: { createMany: vi.fn() },
  pricingRule: { deleteMany: vi.fn(), createMany: vi.fn() },
  activityLog: { create: vi.fn() },
}));
const transaction = vi.hoisted(() => vi.fn(async (callback: (value: typeof tx) => unknown) => callback(tx)));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: transaction } }));

import { nextEstimatorVersion, saveEstimatorService } from "./estimator-admin";

const input = { id: "seed-estimator", isActive: true, pricingMode: "ESTIMATE" as const, unit: "SQFT" as const, baseRate: 100, minCharge: 0, minArea: 100, maxArea: 10000, spreadPercent: 10, roundTo: 100, sortOrder: 0, disclaimer: null, includedText: [], notIncludedText: [], fields: [], rules: [] };

describe("estimator admin transactions", () => {
  it("bumps the version for each saved change", async () => {
    tx.estimatorService.findUnique.mockResolvedValue({ id: input.id, slug: "building", version: 4, fields: [], rules: [] });
    tx.estimatorService.update.mockResolvedValue({ id: input.id, slug: "building", version: 5 });
    await expect(saveEstimatorService(input, "user-1")).resolves.toEqual({ version: 5 });
    expect(tx.estimatorService.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ version: 5 }) }));
    expect(tx.activityLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "estimator.update", entityId: input.id }) }));
    expect(nextEstimatorVersion(4)).toBe(5);
  });
});
