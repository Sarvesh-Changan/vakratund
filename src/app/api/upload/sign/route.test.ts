import { describe, expect, it, vi } from "vitest";

class MockAuthHttpError extends Error {
  readonly status = 403 as const;
  constructor() { super("Forbidden."); }
}

const requirePermissionMock = vi.hoisted(() => vi.fn());
const signUploadParametersMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/errors", () => ({ AuthHttpError: MockAuthHttpError }));
vi.mock("@/lib/auth/session", () => ({ requirePermission: requirePermissionMock }));
vi.mock("@/lib/cloudinary/signature", () => ({ signUploadParameters: signUploadParametersMock }));
vi.mock("@/lib/env", () => ({ getRequiredSecret: vi.fn(() => "unit-test".repeat(4)) }));

describe("upload signature authorization", () => {
  it("requires media:write permission", async () => {
    requirePermissionMock.mockRejectedValue(new MockAuthHttpError());
    const { POST } = await import("@/app/api/upload/sign/route");
    const response = await POST(new Request("http://localhost:3000/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "projects", kind: "IMAGE" }) }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden." });
  });

  it("requires content:write for service uploads even when media access is granted", async () => {
    requirePermissionMock.mockImplementation(async (permission: string) => {
      if (permission === "media:write") return { user: { id: "editor" } };
      throw new MockAuthHttpError();
    });
    const { POST } = await import("@/app/api/upload/sign/route");
    const response = await POST(new Request("http://localhost:3000/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "services", kind: "IMAGE" }) }));
    expect(response.status).toBe(403);
    expect(requirePermissionMock).toHaveBeenCalledWith("content:write", { mode: "api" });
  });

  it("rejects an SVG upload request for the pages section", async () => {
    requirePermissionMock.mockResolvedValue({ user: { id: "editor" } });
    const { POST } = await import("@/app/api/upload/sign/route");
    const response = await POST(new Request("http://localhost:3000/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "pages", kind: "IMAGE", format: "svg" }) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid upload request." });
  });

  it("signs page images with only the raster format allowlist", async () => {
    requirePermissionMock.mockResolvedValue({ user: { id: "editor" } });
    signUploadParametersMock.mockReturnValue({ apiKey: "key", cloudName: "example", resourceType: "image", timestamp: 100, expiresAt: 200, signature: "signature", allowedFormats: ["jpg", "jpeg", "png", "webp", "avif"], signedParameterNames: ["timestamp", "folder", "allowed_formats"] });
    const { POST } = await import("@/app/api/upload/sign/route");
    const response = await POST(new Request("http://localhost:3000/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "pages", kind: "IMAGE" }) }));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.allowed_formats).toEqual(["jpg", "jpeg", "png", "webp", "avif"]);
    expect(result.allowed_formats).not.toContain("svg");
  });
});
