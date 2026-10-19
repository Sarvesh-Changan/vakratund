import { z } from "zod";

export const SEO_PATHS = ["/", "/about", "/services", "/projects", "/gallery", "/faqs", "/contact", "/estimate", "/testimonials", "/privacy"] as const;
const optionalText = (max: number) => z.string().trim().max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.").optional().or(z.literal(""));
const optionalUrl = z.string().trim().max(500).refine((value) => value === "" || value.startsWith("/") || value.startsWith("https://"), "Use an internal path or HTTPS URL.").optional().or(z.literal(""));
export const pageSeoSchema = z.object({ path: z.enum(SEO_PATHS), title: optionalText(60), description: optionalText(160), ogImageId: z.string().cuid().nullable(), canonical: optionalUrl, noIndex: z.boolean() }).strict();
export type PageSeoInput = z.infer<typeof pageSeoSchema>;
