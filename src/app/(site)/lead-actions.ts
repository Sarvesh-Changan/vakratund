"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getEnv } from "@/lib/env";
import { checkLeadSubmitLimit, hashIp, requestIp } from "@/lib/rate-limit/lead-submit";
import { contactSchema } from "@/lib/validation/contact";
import { contactLeadSubmissionSchema, projectEnquirySubmissionSchema } from "@/lib/validation/leads";
import { normalizeIndianPhone } from "@/lib/validation/quote-submission";
import { scheduleLeadNotification } from "@/server/notifications/schedule";
import { persistPublicLead, ProjectNotFoundError } from "@/server/services/public-leads";

const MINIMUM_FILL_TIME_MS = 1_200;

export type LeadActionError = {
  ok: false;
  code: string;
  message: string;
  status: number;
  retryAfterSeconds?: number;
  fieldErrors?: Record<string, string[]>;
};

function failure(
  code: string,
  message: string,
  status = 400,
  extra: Partial<LeadActionError> = {},
): LeadActionError {
  return { ok: false, code, message, status, ...extra };
}
function record(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function nestedContact(input: Record<string, unknown>): Record<string, unknown> {
  const value = input.contact;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): Record<string, string[]> {
  return error.flatten().fieldErrors;
}

async function verifyTurnstile(token: unknown): Promise<boolean> {
  const secret = getEnv().TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (typeof token !== "string" || token.length === 0) return false;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return Boolean(
      result &&
        typeof result === "object" &&
        "success" in result &&
        result.success === true,
    );
  } catch {
    return false;
  }
}

async function guard(input: unknown): Promise<
  | { ok: true; raw: Record<string, unknown>; ipHash: string }
  | LeadActionError
> {
  const requestHeaders = await headers();
  const raw = record(input);
  const contact = nestedContact(raw);
  const rawPhone = typeof contact.phone === "string" ? contact.phone : "invalid-phone";
  const normalizedForLimit = normalizeIndianPhone(rawPhone) ?? rawPhone.slice(0, 80);
  const ipHash = hashIp(requestIp(requestHeaders));
  const rate = checkLeadSubmitLimit(ipHash, normalizedForLimit);
  if (!rate.allowed) {
    return failure("RATE_LIMITED", "Too many enquiries. Please try again later.", 429, {
      retryAfterSeconds: rate.retryAfterSeconds,
    });
  }

  if (typeof contact.website !== "string" || contact.website.trim() !== "") {
    return failure("BOT_DETECTED", "We could not submit this enquiry.");
  }
  const formStartedAt = raw.formStartedAt;
  if (
    typeof formStartedAt !== "number" ||
    !Number.isFinite(formStartedAt) ||
    Date.now() - formStartedAt < MINIMUM_FILL_TIME_MS
  ) {
    return failure(
      "FORM_TOO_FAST",
      "Please take a moment to review your details before submitting.",
    );
  }
  if (!(await verifyTurnstile(raw.turnstileToken))) {
    return failure(
      "BOT_VERIFICATION_FAILED",
      "We could not verify this enquiry. Please try again.",
    );
  }
  return { ok: true, raw, ipHash };
}

function normalizeContact(contact: {
  name: string;
  phone: string;
  email?: string;
  location: string;
  message: string;
  website: string;
}) {
  const normalizedPhone = normalizeIndianPhone(contact.phone);
  if (!normalizedPhone) return null;
  const parsed = contactSchema.safeParse({ ...contact, phone: normalizedPhone });
  return parsed.success ? { ...parsed.data, phone: normalizedPhone } : null;
}

async function saveLead(
  type: "CONTACT" | "PROJECT_ENQUIRY",
  input: Omit<Parameters<typeof persistPublicLead>[0], "type">,
): Promise<Awaited<ReturnType<typeof persistPublicLead>>> {
  const saved = await persistPublicLead({ ...input, type });
  scheduleLeadNotification(saved.leadId);
  return saved;
}

export async function submitContact(input: unknown): Promise<LeadActionError | never> {
  const guarded = await guard(input);
  if (!guarded.ok) return guarded;
  const parsed = contactLeadSubmissionSchema.safeParse(guarded.raw);
  if (!parsed.success) {
    return failure("VALIDATION_ERROR", "Please correct the enquiry details.", 400, {
      fieldErrors: fieldErrors(parsed.error),
    });
  }
  const contact = normalizeContact(parsed.data.contact);
  if (!contact) return failure("VALIDATION_ERROR", "Use a valid Indian phone number.");
  let saved: Awaited<ReturnType<typeof persistPublicLead>>;
  try {
    saved = await saveLead("CONTACT", { name: contact.name, phone: contact.phone, email: contact.email, location: contact.location, message: contact.message, consent: false, tracking: parsed.data.tracking, ipHash: guarded.ipHash });
  } catch {
    return failure("SUBMISSION_FAILED", "We could not save your enquiry. Please try again.", 500);
  }
  redirect(`/contact/thank-you?ref=${encodeURIComponent(saved.publicId)}`);
}

export async function submitProjectEnquiry(input: unknown): Promise<LeadActionError | never> {
  const guarded = await guard(input);
  if (!guarded.ok) return guarded;
  const parsed = projectEnquirySubmissionSchema.safeParse(guarded.raw);
  if (!parsed.success) {
    return failure("VALIDATION_ERROR", "Please correct the enquiry details.", 400, {
      fieldErrors: fieldErrors(parsed.error),
    });
  }
  const contact = normalizeContact(parsed.data.contact);
  if (!contact) return failure("VALIDATION_ERROR", "Use a valid Indian phone number.");
  let saved: Awaited<ReturnType<typeof persistPublicLead>>;
  try {
    saved = await saveLead("PROJECT_ENQUIRY", { name: contact.name, phone: contact.phone, email: contact.email, location: contact.location, message: contact.message, consent: false, tracking: parsed.data.tracking, ipHash: guarded.ipHash, projectSlug: parsed.data.projectSlug });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return failure("PROJECT_NOT_FOUND", "That project is no longer available.", 404);
    }
    return failure("SUBMISSION_FAILED", "We could not save your enquiry. Please try again.", 500);
  }
  redirect(`/project-enquiry/thank-you?ref=${encodeURIComponent(saved.publicId)}`);
}

