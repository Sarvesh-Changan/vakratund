import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const checkContactEventLimit = vi.fn(() => ({ allowed: true, limit: 60, remaining: 59, retryAfterSeconds: 600 }));
const hashRequestIp = vi.fn(() => "hashed-ip");

vi.mock("@/lib/db/client", () => ({ prisma: { contactEvent: { create } } }));
vi.mock("@/lib/rate-limit/contact-events", () => ({ checkContactEventLimit, hashRequestIp }));

describe("contact events route", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({ id: "event-1" });
    checkContactEventLimit.mockReturnValue({ allowed: true, limit: 60, remaining: 59, retryAfterSeconds: 600 });
  });

  it("validates and stores a hashed contact event", async () => {
    const { POST } = await import("@/app/api/events/route");
    const response = await POST(new Request("http://localhost:3000/api/events", { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": "203.0.113.1" }, body: JSON.stringify({ type: "WHATSAPP", pagePath: "/contact", context: "mobile-bar" }) }));
    expect(response.status).toBe(204);
    expect(create).toHaveBeenCalledWith({ data: { type: "WHATSAPP", pagePath: "/contact", context: "mobile-bar", ipHash: "hashed-ip" } });
  });

  it("rejects cross-origin requests and malformed payloads", async () => {
    const { POST } = await import("@/app/api/events/route");
    const forbidden = await POST(new Request("http://localhost:3000/api/events", { method: "POST", headers: { origin: "https://attacker.example" }, body: "{}" }));
    expect(forbidden.status).toBe(403);
    const invalid = await POST(new Request("http://localhost:3000/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "CALL", pagePath: "https://attacker.example" }) }));
    expect(invalid.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 429 when the event limit is exceeded", async () => {
    checkContactEventLimit.mockReturnValue({ allowed: false, limit: 60, remaining: 0, retryAfterSeconds: 42 });
    const { POST } = await import("@/app/api/events/route");
    const response = await POST(new Request("http://localhost:3000/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "CALL", pagePath: "/" }) }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
  });
});
