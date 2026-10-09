import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  log: vi.fn(),
  getEnv: vi.fn(),
  smtpConfigured: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { emailLog: { create: mocks.log } } }));
vi.mock("@/lib/env", () => ({
  getEnv: mocks.getEnv,
  smtpConfigured: mocks.smtpConfigured,
  extractEmailAddress: (value: string) => value.match(/<([^<>\s]+)>$/)?.[1] ?? value.trim(),
  splitEmailAddresses: (value: string | undefined) => value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [],
}));
vi.mock("./transport", () => ({ createSmtpTransport: mocks.create }));

import type { Environment } from "@/lib/env";
import { resolveNotifyRecipients, sendEmail, stripHeader } from "@/lib/email";

const environment = { NODE_ENV: "test", NEXT_PUBLIC_SITE_URL: "http://localhost:3000", SMTP_HOST: "smtp.example.test", SMTP_PORT: 587, SMTP_SECURE: false, SMTP_USER: "sender@example.test", SMTP_PASS: "app-password", EMAIL_FROM: "Vakratund <sender@example.test>", LEAD_NOTIFY_TO: "fallback@example.test" } as Environment;

describe("SMTP email delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEnv.mockReturnValue(environment);
    mocks.smtpConfigured.mockReturnValue(true);
  });

  it("prefers valid SiteSetting recipients and falls back to valid env recipients", () => {
    expect(resolveNotifyRecipients(["first@example.test", "bad"], "fallback@example.test,also@example.test")).toEqual(["first@example.test"]);
    expect(resolveNotifyRecipients(["bad"], "fallback@example.test,also@example.test")).toEqual(["fallback@example.test", "also@example.test"]);
  });

  it("strips header control characters", () => {
    expect(stripHeader("Subject\r\nBcc: attacker@example.test")).toBe("SubjectBcc: attacker@example.test");
  });

  it("records SKIPPED when SMTP is not configured without throwing", async () => {
    mocks.smtpConfigured.mockReturnValue(false);
    await expect(sendEmail({ to: "visitor@example.test", subject: "Hello", html: "<p>Hello</p>", text: "Hello", type: "TEST", leadId: "lead-1" })).resolves.toEqual({ ok: false, code: "SMTP_NOT_CONFIGURED" });
    expect(mocks.log).toHaveBeenCalledWith({ data: { type: "TEST", status: "SKIPPED", leadId: "lead-1", errorCode: "SMTP_NOT_CONFIGURED" } });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("sends with a sanitized subject and Reply-To and records SENT", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();
    mocks.create.mockReturnValue({ sendMail, close });
    await expect(sendEmail({ to: "visitor@example.test", subject: "Hello\r\nBcc: bad@example.test", html: "<p>Hello</p>", text: "Hello", replyTo: "visitor@example.test", type: "LEAD_VISITOR_CONFIRMATION", leadId: "lead-1" })).resolves.toEqual({ ok: true });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "visitor@example.test", subject: "HelloBcc: bad@example.test", replyTo: "visitor@example.test" }));
    expect(mocks.log).toHaveBeenCalledWith({ data: { type: "LEAD_VISITOR_CONFIRMATION", status: "SENT", leadId: "lead-1", errorCode: null } });
    expect(close).toHaveBeenCalled();
  });

  it("records FAILED and returns a code when transport fails", async () => {
    mocks.create.mockReturnValue({ sendMail: vi.fn().mockRejectedValue({ code: "EAUTH" }), close: vi.fn() });
    await expect(sendEmail({ to: "visitor@example.test", subject: "Hello", html: "<p>Hello</p>", text: "Hello", type: "TEST" })).resolves.toEqual({ ok: false, code: "EAUTH" });
    expect(mocks.log).toHaveBeenCalledWith({ data: { type: "TEST", status: "FAILED", leadId: null, errorCode: "EAUTH" } });
  });
});
