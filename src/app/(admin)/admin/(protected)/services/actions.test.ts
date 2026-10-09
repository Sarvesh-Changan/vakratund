import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const createServiceRecord = vi.hoisted(() => vi.fn());
const getServiceRecord = vi.hoisted(() => vi.fn());
const updateServiceRecord = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/services", () => ({
  createService: createServiceRecord,
  deleteService: vi.fn(),
  getService: getServiceRecord,
  reorderServices: vi.fn(),
  togglePublishService: vi.fn(),
  updateService: updateServiceRecord,
  ServiceNotFoundError: class ServiceNotFoundError extends Error {},
  ServiceSlugConflictError: class ServiceSlugConflictError extends Error {},
}));

import { createService, updateService } from "@/app/(admin)/admin/(protected)/services/actions";

const validInput = {
  title: "Building Construction",
  slug: "",
  shortDesc: "Construction service.",
  description: "A Markdown description.",
  scopeItems: ["RCC works"],
  iconKey: "Building2",
  coverId: null,
  isFeatured: false,
  status: "DRAFT",
  sortOrder: 0,
  seoTitle: "Building Construction",
  seoDesc: "Construction services in Thane.",
};

describe("service action authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServiceRecord.mockResolvedValue({ id: "service-1", slug: "building-construction" });
  });

  it("allows an EDITOR to create content", async () => {
    requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } });
    const result = await createService(validInput);
    expect(result.ok).toBe(true);
    expect(createServiceRecord).toHaveBeenCalledWith(expect.objectContaining({ title: "Building Construction" }), "editor-1");
  });

  it("denies SALES before validation or execution", async () => {
    requirePermission.mockRejectedValue(new Error("Forbidden"));
    await expect(createService({})).rejects.toThrow("Forbidden");
    expect(createServiceRecord).not.toHaveBeenCalled();
  });

  it("invalidates the public service cache after an edit", async () => {
    requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } });
    getServiceRecord.mockResolvedValue({ slug: "old-service" });
    updateServiceRecord.mockResolvedValue({ id: "c123456789012345678901234", slug: "updated-service" });

    const result = await updateService({ ...validInput, id: "c123456789012345678901234", title: "Updated service" });

    expect(result.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("services", "max");
    expect(revalidateTag).toHaveBeenCalledWith("service:old-service", "max");
    expect(revalidateTag).toHaveBeenCalledWith("service:updated-service", "max");
  });
});
