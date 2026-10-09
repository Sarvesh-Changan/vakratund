import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(async () => new Headers({ "x-real-ip": "203.0.113.10" })),
  redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }),
  limit: vi.fn(),
  loadConfig: vi.fn(),
  validate: vi.fn(),
  calculate: vi.fn(),
  persist: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/env", () => ({ getEnv: vi.fn(() => ({ TURNSTILE_SECRET_KEY: undefined })) }));
vi.mock("@/lib/rate-limit/lead-submit", () => ({ checkLeadSubmitLimit: mocks.limit, hashIp: vi.fn(() => "hashed-ip"), requestIp: vi.fn(() => "203.0.113.10") }));
vi.mock("@/server/estimator/load-config", () => ({ loadEstimatorConfigFromDatabase: mocks.loadConfig }));
vi.mock("@/server/estimator/validate", () => ({ validateAnswers: mocks.validate }));
vi.mock("@/server/estimator/calculate", () => ({ calculateEstimate: mocks.calculate }));
vi.mock("@/server/services/quotes", () => ({ persistQuoteSubmission: mocks.persist }));
vi.mock("@/server/notifications/schedule", () => ({ scheduleLeadNotification: mocks.notify }));

import { submitQuote } from "./actions";

const config = { serviceId: "service-1", slug: "building", name: "Building", pricingMode: "ESTIMATE", baseRate: 10, fields: [] };
const input = { serviceSlug: "building", answers: { area: 500 }, contact: { name: "Asha Shah", phone: "+919821502956", email: "", location: "Thane", requirements: "Please call me.", consent: true, website: "", minimumFillTimeMs: 3000 }, formStartedAt: Date.now() - 3000, clientPrice: { low: 1, high: 2 } };

describe("submitQuote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockReturnValue({ allowed: true, limit: 5, remaining: 4, retryAfterSeconds: 600 });
    mocks.loadConfig.mockResolvedValue(config);
    mocks.validate.mockReturnValue({ valid: true, errors: [] });
    mocks.calculate.mockReturnValue({ low: 5000, high: 5500, breakdown: [], warnings: [] });
    mocks.persist.mockResolvedValue({ leadId: "lead-1", publicId: "VK-ABC234", isDuplicate: false });
  });

  it("returns a 429-style error when rate limited", async () => {
    mocks.limit.mockReturnValue({ allowed: false, limit: 5, remaining: 0, retryAfterSeconds: 42 });
    await expect(submitQuote(input)).resolves.toMatchObject({ ok: false, status: 429, retryAfterSeconds: 42 });
    expect(mocks.loadConfig).not.toHaveBeenCalled();
  });

  it("rejects invalid answers before calculating or persisting", async () => {
    mocks.validate.mockReturnValue({ valid: false, errors: [{ field: "area", code: "MIN", message: "Area is too small." }] });
    await expect(submitQuote(input)).resolves.toMatchObject({ ok: false, code: "INVALID_ANSWERS" });
    expect(mocks.calculate).not.toHaveBeenCalled();
    expect(mocks.persist).not.toHaveBeenCalled();
  });

  it("recomputes server-side and ignores the client price before redirecting", async () => {
    await expect(submitQuote(input)).rejects.toThrow("redirect:/estimate/thank-you?ref=VK-ABC234");
    expect(mocks.calculate).toHaveBeenCalledWith(config, input.answers);
    expect(mocks.persist).toHaveBeenCalledWith(expect.objectContaining({ result: { low: 5000, high: 5500, breakdown: [], warnings: [] } }));
    expect(mocks.notify).toHaveBeenCalledWith("lead-1");
  });
});
