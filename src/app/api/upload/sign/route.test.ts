import { describe, expect, it, vi } from "vitest";

class MockAuthHttpError extends Error {
  readonly status = 403 as const;
  constructor() { super("Forbidden."); }
}

vi.mock("@/lib/auth/errors", () => ({ AuthHttpError: MockAuthHttpError }));
vi.mock("@/lib/auth/session", () => ({ requirePermission: vi.fn(async () => { throw new MockAuthHttpError(); }) }));
vi.mock("@/lib/cloudinary/signature", () => ({ signUploadParameters: vi.fn() }));
vi.mock("@/lib/env", () => ({ getRequiredSecret: vi.fn(() => "unit-test".repeat(4)) }));

describe("upload signature authorization", () => {
  it("requires media:write permission", async () => {
    const { POST } = await import("@/app/api/upload/sign/route");
    const response = await POST(new Request("http://localhost:3000/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: "projects", kind: "IMAGE" }) }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden." });
  });
});
