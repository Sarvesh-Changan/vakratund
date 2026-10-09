import { z } from "zod";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");

export const contactSchema = z.object({
  name: plainText(100),
  phone: z.string().trim().regex(/^\+91\d{10}$/, "Use an Indian number in +91XXXXXXXXXX format."),
  email: z.string().trim().email("Enter a valid email address.").max(254).optional().or(z.literal("")),
  location: plainText(160),
  message: plainText(2000),
  website: z.string().max(0, "Leave this field empty."),
  consent: z.boolean().refine((value) => value, "Please agree to the Privacy Policy before sending."),
}).strict();

export type ContactInput = z.infer<typeof contactSchema>;

export function sanitizeProjectPrefill(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function sanitizeProjectSlug(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw) ? raw.slice(0, 160) : undefined;
}
