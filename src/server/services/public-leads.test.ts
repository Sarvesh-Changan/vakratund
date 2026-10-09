import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  project: { findFirst: vi.fn() },
  lead: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  leadStatusHistory: { create: vi.fn() },
}));
const transaction = vi.hoisted(() => vi.fn(async (callback: (value: typeof tx) => unknown) => callback(tx)));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: transaction } }));

import { persistPublicLead } from "./public-leads";

describe("persistPublicLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.project.findFirst.mockResolvedValue({ slug: "repair-audit-thane" });
    tx.lead.findFirst.mockResolvedValue(null);
    tx.lead.findUnique.mockResolvedValue(null);
    tx.lead.create.mockResolvedValue({ id: "lead-1", publicId: "VK-ABC234", isDuplicate: false });
  });

  it("stores first-party attribution and project slug in one lead transaction", async () => {
    await persistPublicLead({ type: "PROJECT_ENQUIRY", projectSlug: "repair-audit-thane", name: "Asha Shah", phone: "+919821502956", email: "asha@example.com", location: "Thane", message: "Please call me.", consent: true, ipHash: "hashed-ip", tracking: { sourcePage: "/projects/repair-audit-thane", referrer: "https://google.com", utmSource: "google", deviceType: "mobile" } });
    const data = tx.lead.create.mock.calls[0]?.[0].data;
    expect(data.sourcePage).toBe("/projects/repair-audit-thane");
    expect(data.referrer).toBe("https://google.com");
    expect(data.utmSource).toBe("google");
    expect(data.deviceType).toBe("mobile");
    expect(data.message).toContain("Project slug: repair-audit-thane");
    expect(tx.leadStatusHistory.create).toHaveBeenCalled();
  });

  it("flags duplicate phone submissions without discarding them", async () => {
    tx.lead.findFirst.mockResolvedValue({ id: "previous-lead" });
    tx.lead.create.mockResolvedValue({ id: "lead-2", publicId: "VK-DEF456", isDuplicate: true });
    await expect(persistPublicLead({ type: "CONTACT", name: "Asha Shah", phone: "+919821502956", consent: true, ipHash: "hashed-ip" })).resolves.toMatchObject({ isDuplicate: true });
    expect(tx.lead.create.mock.calls[0]?.[0].data.isDuplicate).toBe(true);
  });
});
