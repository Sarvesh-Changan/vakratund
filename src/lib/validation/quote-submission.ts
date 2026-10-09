import { z } from "zod";
import { trackingSchema } from "./leads";

const answerValue = z.union([z.string().trim().max(200), z.number().finite(), z.boolean(), z.array(z.string().trim().max(200)).max(100)]);

export const quoteSubmissionSchema = z.object({
  serviceSlug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  answers: z.record(z.string().trim().min(1).max(80), answerValue),
  contact: z.object({
    name: z.string().trim().min(1).max(100).refine((value) => !/[<>]/.test(value), "HTML is not allowed."),
    phone: z.string().trim().min(1).max(30),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    location: z.string().trim().min(1).max(160).refine((value) => !/[<>]/.test(value), "HTML is not allowed."),
    requirements: z.string().trim().min(1).max(2_000).refine((value) => !/[<>]/.test(value), "HTML is not allowed."),
    consent: z.boolean().refine((value) => value, "Consent is required."),
    website: z.string().max(200),
    minimumFillTimeMs: z.number().finite(),
}).strict(),
  formStartedAt: z.number().finite(),
  tracking: trackingSchema.optional(),
  turnstileToken: z.string().trim().max(2_048).optional(),
  clientPrice: z.object({ low: z.number().finite().nullable(), high: z.number().finite().nullable() }).strict().optional(),
}).strict();

export type QuoteSubmissionInput = z.infer<typeof quoteSubmissionSchema>;

export function normalizeIndianPhone(value: string): string | null {
  const compact = value.replace(/[\s()-]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact;
  if (/^91[6-9]\d{9}$/.test(compact)) return `+${compact}`;
  if (/^0[6-9]\d{9}$/.test(compact)) return `+91${compact.slice(1)}`;
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
  return null;
}

export function publicReferenceSchema(value: string): boolean {
  return /^VK-[A-Z2-9]{6}$/.test(value);
}
