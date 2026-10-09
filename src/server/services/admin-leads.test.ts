import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  historyCreate: vi.fn(),
  noteCreate: vi.fn(),
  activity: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/server/services/activity", () => ({ logActivity: mocks.activity }));

import { buildLeadWhere, canChangeStatus, csvCell, isReopen, leadScope, leadsToCsv, updateLeadStatus } from "@/server/services/admin-leads";

describe("admin lead service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      lead: { findFirst: mocks.findFirst, update: mocks.update },
      leadStatusHistory: { create: mocks.historyCreate },
      leadNote: { create: mocks.noteCreate },
      user: { findFirst: vi.fn() },
    }));
  });

  it("scopes SALES to their own and unassigned leads", () => {
    expect(leadScope({ id: "sales-1", role: "SALES" })).toEqual({ deletedAt: null, OR: [{ assignedToId: "sales-1" }, { assignedToId: null }] });
    expect(buildLeadWhere({ page: 1, pageSize: 25, sort: "createdAt", direction: "desc", q: "Asha" }, { id: "sales-1", role: "SALES" })).toMatchObject({ deletedAt: null, OR: [{ assignedToId: "sales-1" }, { assignedToId: null }] });
  });

  it("denies EDITOR in the service layer", () => {
    expect(() => leadScope({ id: "editor-1", role: "EDITOR" })).toThrow("Forbidden");
  });

  it("accepts ordered pipeline transitions and records history", async () => {
    mocks.findFirst.mockResolvedValue({ id: "lead-1", status: "NEW", assignedToId: null });
    await updateLeadStatus({ leadId: "lead-1", status: "CONTACTED" }, { id: "admin-1", role: "ADMIN" });
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "lead-1" }, data: { status: "CONTACTED" } });
    expect(mocks.historyCreate).toHaveBeenCalledWith({ data: { leadId: "lead-1", fromStatus: "NEW", toStatus: "CONTACTED", changedBy: "admin-1" } });
    expect(mocks.activity).toHaveBeenCalledWith(expect.objectContaining({ action: "lead.status.update", entityId: "lead-1" }));
  });

  it("requires a reason when reopening a closed lead", async () => {
    mocks.findFirst.mockResolvedValue({ id: "lead-1", status: "CLOSED", assignedToId: null });
    await expect(updateLeadStatus({ leadId: "lead-1", status: "CONTACTED" }, { id: "admin-1", role: "ADMIN" })).rejects.toThrow("reason");
    expect(mocks.update).not.toHaveBeenCalled();
    await updateLeadStatus({ leadId: "lead-1", status: "CONTACTED", reason: "Customer requested a follow-up." }, { id: "admin-1", role: "ADMIN" });
    expect(mocks.historyCreate).toHaveBeenCalledWith({ data: { leadId: "lead-1", fromStatus: "CLOSED", toStatus: "CONTACTED", changedBy: "admin-1" } });
  });

  it("exposes transition helpers for the UI and policy tests", () => {
    expect(isReopen("CLOSED", "NEW")).toBe(true);
    expect(canChangeStatus("NEW", "QUALIFIED")).toBe(true);
    expect(canChangeStatus("CLOSED", "CLOSED")).toBe(true);
  });

  it("escapes CSV cells and prefixes formula-like values", () => {
    expect(csvCell("=HYPERLINK(\"https://evil.test\")")).toBe('"\t=HYPERLINK(""https://evil.test"")"');
    expect(csvCell("hello, \"world\"\nnext")).toBe('"hello, ""world""\nnext"');
    const csv = leadsToCsv([{ publicId: "VK-1", name: "=Formula", phone: "+919999999999", email: null, type: "CONTACT", status: "NEW", sourcePage: "/contact", isDuplicate: false, createdAt: new Date("2026-01-01T00:00:00.000Z") }]);
    expect(csv).toContain("\t=Formula");
  });
});
