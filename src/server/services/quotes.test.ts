import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  lead: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  leadStatusHistory: { create: vi.fn() },
}));
const transaction = vi.hoisted(() => vi.fn(async (callback: (value: typeof tx) => unknown) => callback(tx)));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: transaction } }));

import { persistQuoteSubmission } from "./quotes";
import type { EstimatorConfig } from "@/server/estimator/types";
import type { QuoteSubmissionInput } from "@/lib/validation/quote-submission";

const config: EstimatorConfig = {
  serviceId: "service-1", slug: "building", name: "Building", pricingMode: "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 10, minCharge: 0, minArea: 100, maxArea: 10_000, spreadPercent: 10, roundTo: 100, version: 4,
  fields: [{ key: "area", label: "Area", type: "NUMBER", required: true, sortOrder: 0, min: 100, max: 10_000, step: 1, effectType: "NONE", effectValue: null, options: [] }], rules: [], locationZones: [],
};
const submission: QuoteSubmissionInput = { serviceSlug: "building", answers: { area: 500 }, contact: { name: "Asha Shah", phone: "+919821502956", email: "", location: "Thane", requirements: "Please call me.", consent: true, website: "", minimumFillTimeMs: 3000 }, formStartedAt: Date.now() - 3000, clientPrice: { low: 1, high: 2 } };
const result = { low: 5000, high: 5500, breakdown: [{ id: "base", label: "Base", kind: "BASE" as const, amount: 5000 }], warnings: [] };

describe("persistQuoteSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.lead.findFirst.mockResolvedValue(null);
    tx.lead.findUnique.mockResolvedValue(null);
    tx.lead.create.mockResolvedValue({ id: "lead-1", publicId: "VK-ABC234", isDuplicate: false });
  });

  it("stores the server result instead of a tampered client price", async () => {
    await persistQuoteSubmission({ submission, config, result, normalizedPhone: "+919821502956", ipHash: "ip-hash" });
    const data = tx.lead.create.mock.calls[0]?.[0].data;
    expect(data.quote.create.lowAmount).toBe(5000);
    expect(data.quote.create.highAmount).toBe(5500);
    expect(data.quote.create.configVersion).toBe(4);
  });

  it("flags a phone duplicate within the retention window", async () => {
    tx.lead.findFirst.mockResolvedValue({ id: "previous-lead" });
    tx.lead.create.mockResolvedValue({ id: "lead-2", publicId: "VK-DEF456", isDuplicate: true });
    await expect(persistQuoteSubmission({ submission, config, result, normalizedPhone: "+919821502956", ipHash: "ip-hash" })).resolves.toMatchObject({ isDuplicate: true });
    expect(tx.lead.create.mock.calls[0]?.[0].data.isDuplicate).toBe(true);
  });

  it("takes an immutable snapshot before later config edits", async () => {
    await persistQuoteSubmission({ submission, config, result, normalizedPhone: "+919821502956", ipHash: "ip-hash" });
    const snapshot = tx.lead.create.mock.calls[0]?.[0].data.quote.create.configSnapshot as { baseRate: number };
    config.baseRate = 999;
    expect(snapshot.baseRate).toBe(10);
  });
});
