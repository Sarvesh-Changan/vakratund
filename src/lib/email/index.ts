import "server-only";

import { prisma } from "@/lib/db/client";
import { extractEmailAddress, getEnv, smtpConfigured, splitEmailAddresses } from "@/lib/env";
import { createSmtpTransport } from "./transport";

export type EmailType = "LEAD_ADMIN_NOTIFICATION" | "LEAD_VISITOR_CONFIRMATION" | "PASSWORD_RESET" | "AUTH_LOCKOUT" | "TEST";
export type SendEmailInput = { to: string | readonly string[]; subject: string; html: string; text: string; replyTo?: string; type: EmailType; leadId?: string };
export type SendEmailResult = { ok: true } | { ok: false; code: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let emailDisabledLogged = false;

export function stripHeader(value: string): string { return value.replace(/[\u0000-\u001f\u007f]/g, "").trim(); }
export function validEmail(value: string): boolean { return EMAIL_PATTERN.test(stripHeader(value)); }

function cleanRecipients(value: string | readonly string[]): string[] {
  const values = typeof value === "string" ? splitEmailAddresses(value) : [...value];
  return [...new Set(values.map(stripHeader).filter(validEmail))];
}

export function resolveNotifyRecipients(settingsRecipients: readonly string[], fallback: string | undefined): string[] {
  const configured = cleanRecipients(settingsRecipients);
  return configured.length ? configured : cleanRecipients(fallback ?? "");
}

async function writeEmailLog(type: EmailType, status: "SENT" | "FAILED" | "SKIPPED", leadId: string | undefined, errorCode: string | undefined): Promise<void> {
  try { await prisma.emailLog.create({ data: { type, status, leadId: leadId ?? null, errorCode: errorCode ?? null } }); } catch { /* Email delivery must not fail because audit storage is unavailable. */ }
}

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z0-9_]+$/.test(error.code)) return error.code;
  return "SMTP_SEND_FAILED";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = cleanRecipients(input.to);
  if (!recipients.length) { await writeEmailLog(input.type, "SKIPPED", input.leadId, "NO_VALID_RECIPIENT"); return { ok: false, code: "NO_VALID_RECIPIENT" }; }
  const environment = getEnv();
  if (!smtpConfigured(environment)) {
    await writeEmailLog(input.type, "SKIPPED", input.leadId, "SMTP_NOT_CONFIGURED");
    if (!emailDisabledLogged) { emailDisabledLogged = true; console.info("email disabled: SMTP not configured"); }
    return { ok: false, code: "SMTP_NOT_CONFIGURED" };
  }
  const from = stripHeader(environment.EMAIL_FROM ?? "");
  const replyTo = input.replyTo ? stripHeader(input.replyTo) : undefined;
  if (!validEmail(extractEmailAddress(from) ?? "") || (replyTo && !validEmail(replyTo))) {
    await writeEmailLog(input.type, "FAILED", input.leadId, "INVALID_HEADER");
    return { ok: false, code: "INVALID_HEADER" };
  }
  const transport = createSmtpTransport(environment);
  if (!transport) { await writeEmailLog(input.type, "SKIPPED", input.leadId, "SMTP_NOT_CONFIGURED"); return { ok: false, code: "SMTP_NOT_CONFIGURED" }; }
  try {
    await transport.sendMail({ from, to: recipients.join(","), subject: stripHeader(input.subject), html: input.html, text: input.text, ...(replyTo ? { replyTo } : {}) });
    await writeEmailLog(input.type, "SENT", input.leadId, undefined);
    return { ok: true };
  } catch (error) {
    const code = errorCode(error);
    await writeEmailLog(input.type, "FAILED", input.leadId, code);
    return { ok: false, code };
  } finally { transport.close(); }
}
