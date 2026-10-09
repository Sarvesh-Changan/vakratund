import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requirePermission: vi.fn(), update: vi.fn(), exportLeads: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/server/services/admin-leads", () => ({ updateLeadStatus: mocks.update, addLeadNote: vi.fn(), updateLeadAssignment: vi.fn(), softDeleteLead: vi.fn(), exportAdminLeads: mocks.exportLeads }));

import { exportLeadsAction, updateLeadStatusAction } from "@/app/(admin)/admin/(protected)/leads/actions";

describe("lead actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies EDITOR before validation or service execution", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("Forbidden"));
    await expect(updateLeadStatusAction({})).rejects.toThrow("Forbidden");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("requires the export permission and returns CSV content", async () => {
    mocks.requirePermission.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.exportLeads.mockResolvedValue("Reference,Name\nVK-1,Asha\n");
    const result = await exportLeadsAction();
    expect(mocks.requirePermission).toHaveBeenCalledWith("leads:export");
    expect(result).toEqual({ ok: true, data: "Reference,Name\nVK-1,Asha\n" });
  });
});
