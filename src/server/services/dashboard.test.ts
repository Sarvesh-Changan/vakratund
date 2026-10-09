import { beforeEach, describe, expect, it, vi } from "vitest";

import type { prisma } from "@/lib/db/client";
import { getContentDashboardData, getLeadDashboardData } from "@/server/services/dashboard";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));

describe("dashboard aggregation service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns lead KPIs and grouped dashboard data from bounded database queries", async () => {
    const leadCount = vi.fn().mockResolvedValue(12);
    const leadGroupBy = vi.fn()
      .mockResolvedValueOnce([{ status: "NEW", _count: { _all: 8 } }, { status: "CONVERTED", _count: { _all: 4 } }])
      .mockResolvedValueOnce([{ sourcePage: "/services", _count: { _all: 7 } }, { sourcePage: null, _count: { _all: 5 } }])
      .mockResolvedValueOnce([{ type: "QUOTE", _count: { _all: 9 } }, { type: "CONTACT", _count: { _all: 3 } }]);
    const leadFindMany = vi.fn().mockResolvedValue([
      { id: "lead-1", name: "Test enquiry", type: "QUOTE", status: "NEW", sourcePage: "/services", createdAt: new Date("2026-10-01T10:00:00Z") },
    ]);
    const quoteAggregate = vi.fn().mockResolvedValue({ _count: { _all: 6 }, _sum: { lowAmount: 120000, highAmount: 240000 } });
    const db = { lead: { count: leadCount, groupBy: leadGroupBy, findMany: leadFindMany }, quote: { aggregate: quoteAggregate } } as unknown as typeof prisma;

    const result = await getLeadDashboardData(db);

    expect(result.kpis).toMatchObject({ newToday: 12, newLast7Days: 12, newLast30Days: 12, quoteCount: 6, estimatedLowTotal: 120000, estimatedHighTotal: 240000 });
    expect(result.kpis.conversionRate).toBe(1);
    expect(result.leadsByStatus).toEqual([{ label: "NEW", count: 8 }, { label: "CONVERTED", count: 4 }]);
    expect(result.leadsBySourcePage).toEqual([{ label: "/services", count: 7 }, { label: "Unknown page", count: 5 }]);
    expect(result.leadsByType).toEqual([{ label: "QUOTE", count: 9 }, { label: "CONTACT", count: 3 }]);
    expect(result.recentLeads).toHaveLength(1);
    expect(leadCount).toHaveBeenCalledTimes(34);
    expect(leadFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 8 }));
  });

  it("aggregates editor content counts without loading content tables", async () => {
    const count = vi.fn()
      .mockResolvedValueOnce(2).mockResolvedValueOnce(3).mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5).mockResolvedValueOnce(6).mockResolvedValueOnce(7);
    const db = {
      service: { count },
      project: { count },
      blogPost: { count },
    } as unknown as typeof prisma;

    await expect(getContentDashboardData(db)).resolves.toEqual({ kind: "content", publishedCount: 9, draftCount: 18 });
    expect(count).toHaveBeenCalledTimes(6);
  });
});
