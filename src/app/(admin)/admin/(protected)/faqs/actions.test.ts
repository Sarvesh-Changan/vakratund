import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const createRecord = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/faqs", () => ({ createFaq: createRecord, deleteFaq: vi.fn(), getFaq: vi.fn(), reorderFaqs: vi.fn(), togglePublishFaq: vi.fn(), updateFaq: vi.fn(), FaqNotFoundError: class FaqNotFoundError extends Error {}, FaqServiceNotFoundError: class FaqServiceNotFoundError extends Error {} }));

import { createFaq } from "@/app/(admin)/admin/(protected)/faqs/actions";

const validInput = { question: "How does it work?", answer: "**Inspection** comes first.", serviceId: null, status: "DRAFT", sortOrder: 0 };

describe("FAQ action authorization", () => {
  beforeEach(() => { vi.clearAllMocks(); createRecord.mockResolvedValue({ id: "faq-1" }); });
  it("allows EDITOR content mutations", async () => { requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } }); const result = await createFaq(validInput); expect(result.ok).toBe(true); expect(createRecord).toHaveBeenCalledWith(expect.objectContaining({ question: "How does it work?" }), "editor-1"); });
  it("denies SALES before validation or execution", async () => { requirePermission.mockRejectedValue(new Error("Forbidden")); await expect(createFaq({})).rejects.toThrow("Forbidden"); expect(createRecord).not.toHaveBeenCalled(); });
});
