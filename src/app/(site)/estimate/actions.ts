"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getEnv } from "@/lib/env";
import { checkLeadSubmitLimit, hashIp, requestIp } from "@/lib/rate-limit/lead-submit";
import { contactSchema } from "@/lib/validation/contact";
import { normalizeIndianPhone, quoteSubmissionSchema } from "@/lib/validation/quote-submission";
import { loadEstimatorConfigFromDatabase } from "@/server/estimator/load-config";
import { calculateEstimate } from "@/server/estimator/calculate";
import { validateAnswers } from "@/server/estimator/validate";
import { scheduleLeadNotification } from "@/server/notifications/schedule";
import { persistQuoteSubmission } from "@/server/services/quotes";

const MINIMUM_FILL_TIME_MS = 1_200;

export type QuoteActionError = { ok: false; code: string; message: string; status: number; retryAfterSeconds?: number; fieldErrors?: Record<string, string[]> };

function failure(code: string, message: string, status = 400, extra: Partial<QuoteActionError> = {}): QuoteActionError {
  return { ok: false, code, message, status, ...extra };
}

function rawRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
}

function rawContact(input: Record<string, unknown>): Record<string, unknown> {
  const contact = input.contact;
  return contact && typeof contact === "object" && !Array.isArray(contact) ? contact as Record<string, unknown> : {};
}

async function verifyTurnstile(token: unknown): Promise<boolean> {
  const secret = getEnv().TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (typeof token !== "string" || token.length === 0) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ secret, response: token }) });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return Boolean(result && typeof result === "object" && "success" in result && result.success === true);
  } catch {
    return false;
  }
}

function incompleteConfig(config: Awaited<ReturnType<typeof loadEstimatorConfigFromDatabase>>): boolean {
  if (!config || (config.pricingMode === "ESTIMATE" && config.baseRate <= 0)) return true;
  return config.fields.some((field) => field.isActive !== false && field.effectType !== "NONE" && field.effectValue === null) || config.fields.some((field) => field.options.some((option) => option.isActive !== false && option.effectType !== "NONE" && option.effectValue === null));
}

export async function submitQuote(input: unknown): Promise<QuoteActionError | never> {
  const requestHeaders = await headers();
  const raw = rawRecord(input);
  const contact = rawContact(raw);
  const rawPhone = typeof contact.phone === "string" ? contact.phone : "invalid-phone";
  const normalizedForLimit = normalizeIndianPhone(rawPhone) ?? rawPhone.slice(0, 80);
  const ipHash = hashIp(requestIp(requestHeaders));
  const rate = checkLeadSubmitLimit(ipHash, normalizedForLimit);
  if (!rate.allowed) return failure("RATE_LIMITED", "Too many enquiries. Please try again later.", 429, { retryAfterSeconds: rate.retryAfterSeconds });

  if (typeof contact.website !== "string" || contact.website.trim() !== "") return failure("BOT_DETECTED", "We could not submit this enquiry.");
  const formStartedAt = raw.formStartedAt;
  if (typeof formStartedAt !== "number" || !Number.isFinite(formStartedAt) || Date.now() - formStartedAt < MINIMUM_FILL_TIME_MS) return failure("FORM_TOO_FAST", "Please take a moment to review your details before submitting.");
  if (!await verifyTurnstile(raw.turnstileToken)) return failure("BOT_VERIFICATION_FAILED", "We could not verify this enquiry. Please try again.");

  const parsed = quoteSubmissionSchema.safeParse(input);
  if (!parsed.success) return failure("VALIDATION_ERROR", "Please correct the enquiry details.", 400, { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> });
  const normalizedPhone = normalizeIndianPhone(parsed.data.contact.phone);
  if (!normalizedPhone) return failure("VALIDATION_ERROR", "Use a valid Indian phone number.", 400, { fieldErrors: { "contact.phone": ["Use a valid Indian phone number."] } });
  const contactParsed = contactSchema.safeParse({ name: parsed.data.contact.name, phone: normalizedPhone, email: parsed.data.contact.email, location: parsed.data.contact.location, message: parsed.data.contact.requirements, website: "", consent: parsed.data.contact.consent });
  if (!contactParsed.success) return failure("VALIDATION_ERROR", "Please correct the enquiry details.", 400, { fieldErrors: contactParsed.error.flatten().fieldErrors as Record<string, string[]> });

  const config = await loadEstimatorConfigFromDatabase(parsed.data.serviceSlug);
  if (!config || incompleteConfig(config)) return failure("CONFIGURATION_UNAVAILABLE", "This estimator is not available for submission yet.", 409);
  const validation = validateAnswers(config, parsed.data.answers);
  if (!validation.valid) {
    const fieldErrors = validation.errors.reduce<Record<string, string[]>>((errors, error) => ({ ...errors, [error.field]: [...(errors[error.field] ?? []), error.message] }), {});
    return failure("INVALID_ANSWERS", "Please correct the project details.", 400, { fieldErrors });
  }
  const result = calculateEstimate(config, parsed.data.answers);
  if (config.pricingMode === "ESTIMATE" && (result.low === null || result.high === null)) return failure("ESTIMATE_UNAVAILABLE", "A responsible estimate is not available for these details.", 409);

  const submission = { ...parsed.data, contact: { ...parsed.data.contact, phone: normalizedPhone } };
  let saved: Awaited<ReturnType<typeof persistQuoteSubmission>>;
  try {
    saved = await persistQuoteSubmission({ submission, config, result, normalizedPhone, ipHash });
  } catch {
    return failure("SUBMISSION_FAILED", "We could not save your enquiry. Please try again.", 500);
  }
  scheduleLeadNotification(saved.leadId);
  redirect(`/estimate/thank-you?ref=${encodeURIComponent(saved.publicId)}`);
}
