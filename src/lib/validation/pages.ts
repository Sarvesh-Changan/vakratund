import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalText = (max: number) => z.string().trim().max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.").optional().or(z.literal(""));
const href = z.string().trim().max(300).regex(/^(\/|https:\/\/|tel:|mailto:)/, "Use an internal path or a secure URL.");

const heroSchema = z.object({ eyebrow: optionalText(160), title: text(160), description: text(500), primaryCta: text(80), primaryHref: href, secondaryCta: text(80), secondaryHref: href, backgroundImageId: z.string().cuid().nullable() }).strict();
const statsSchema = z.object({ items: z.array(z.object({ label: text(80), value: text(80) }).strict()).min(1).max(8) }).strict();
const processSchema = z.object({ title: text(120), steps: z.array(z.object({ title: text(80), description: optionalText(240) }).strict()).min(1).max(8) }).strict();
const ctaSchema = z.object({ title: text(160), description: optionalText(500), primaryCta: text(80), primaryHref: href, secondaryCta: optionalText(80), secondaryHref: href.optional().or(z.literal("")) }).strict();
const textSectionSchema = z.object({ title: text(160), body: text(20_000) }).strict();

export const pageSectionSchemas = {
  home: { hero: heroSchema, stats: statsSchema, process: processSchema, cta: ctaSchema },
  about: { story: textSectionSchema, mission: textSectionSchema },
  legal: { privacy: textSectionSchema, terms: textSectionSchema },
} as const;

export const pageSectionInputSchema = z.discriminatedUnion("sectionKey", [
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("hero"), content: heroSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("stats"), content: statsSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("process"), content: processSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("cta"), content: ctaSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("about"), sectionKey: z.literal("story"), content: textSectionSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("about"), sectionKey: z.literal("mission"), content: textSectionSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("legal"), sectionKey: z.literal("privacy"), content: textSectionSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("legal"), sectionKey: z.literal("terms"), content: textSectionSchema, isVisible: z.boolean() }).strict(),
]);
export const pageSectionIdSchema = z.object({ pageKey: z.enum(["home", "about", "legal"]), sectionKey: z.string().min(1).max(40) }).strict();
export type PageSectionInput = z.infer<typeof pageSectionInputSchema>;
