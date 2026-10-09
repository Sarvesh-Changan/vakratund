import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalText = (max: number) => z.string().trim().max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.").optional().or(z.literal(""));
const phone = z.string().trim().regex(/^\+91\d{10}$/, "Use an Indian number in +91XXXXXXXXXX format.");
const email = z.string().trim().email().max(254);
const social = z.object({ label: text(40), url: z.string().url().max(500).refine((value) => value.startsWith("https://"), "Social links must use HTTPS.") }).strict();
const credential = z.object({ label: text(100), value: text(300) }).strict();
const day = z.object({ closed: z.boolean(), open: z.string().regex(/^\d{2}:\d{2}$/), close: z.string().regex(/^\d{2}:\d{2}$/) }).strict();
export const businessHoursSchema = z.object({ monday: day, tuesday: day, wednesday: day, thursday: day, friday: day, saturday: day, sunday: day }).strict();
export type BusinessHours = z.infer<typeof businessHoursSchema>;

export function isAllowedMapEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return url.hostname === "maps.google.com" || url.hostname === "maps.app.goo.gl" || ((url.hostname === "google.com" || url.hostname === "www.google.com") && url.pathname.startsWith("/maps"));
  } catch {
    return false;
  }
}

export const settingsSchema = z.object({ businessName: text(160), tagline: optionalText(240), phones: z.array(phone).max(10), email: z.union([email, z.literal("")]), whatsappNumber: z.union([phone, z.literal("")]), whatsappMessage: optionalText(300), address: optionalText(500), mapEmbedUrl: z.union([z.string().url().max(500), z.literal("")]), businessHours: businessHoursSchema, socials: z.array(social).max(20), credentials: z.array(credential).max(20), brochureMediaId: z.string().cuid().nullable(), notifyEmails: z.array(email).max(20), foundedYear: z.number().int().min(1800).max(2200) }).strict().superRefine((value, context) => { if (value.mapEmbedUrl && !isAllowedMapEmbedUrl(value.mapEmbedUrl)) context.addIssue({ code: "custom", path: ["mapEmbedUrl"], message: "Map embeds must use an approved Google Maps domain." }); });
export type SettingsInput = z.infer<typeof settingsSchema>;
