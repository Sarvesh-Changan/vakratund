import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalText = (max: number) => z.string().trim().max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.").optional().or(z.literal(""));
const href = z.string().trim().max(300).regex(/^(\/|https:\/\/|tel:|mailto:)/, "Use an internal path or a secure URL.");

const heroSchema = z.object({ eyebrow: optionalText(160), title: optionalText(160), description: optionalText(500), trustChips: z.array(text(80)).max(3).optional(), primaryCta: text(80), primaryHref: href, secondaryCta: text(80), secondaryHref: href, backgroundImageId: z.string().cuid().nullable() }).strict();
const statsSchema = z.object({ items: z.array(z.object({ label: text(80), value: text(80) }).strict()).max(5) }).strict();
const homeProjectsSchema = z.object({ eyebrow: optionalText(80), title: text(160), description: optionalText(500), viewAllLabel: text(80) }).strict();
const homeServicesSchema = z.object({ eyebrow: optionalText(80), title: text(160), description: optionalText(500), viewAllLabel: text(80), serviceLinkLabel: text(80) }).strict();
const homeWhySchema = z.object({ eyebrow: optionalText(80), title: text(160), description: optionalText(500), quote: optionalText(1000) }).strict();
const homeSpecialtySchema = z.object({ eyebrow: optionalText(80), title: text(160), description: optionalText(500), ctaLabel: text(80), ctaHref: href }).strict();
const homeFaqSchema = z.object({ eyebrow: optionalText(80), title: text(160), viewAllLabel: text(80) }).strict();
const homeEstimatorSchema = z.object({ eyebrow: text(80), title: text(160), description: text(500), ctaLabel: text(80) }).strict();
const processSchema = z.object({ eyebrow: optionalText(80), title: text(120), steps: z.array(z.object({ title: text(80), description: optionalText(240) }).strict()).min(1).max(8) }).strict();
const ctaSchema = z.object({ title: text(160), description: optionalText(500), primaryCta: text(80), primaryHref: href, secondaryCta: optionalText(80), secondaryHref: href.optional().or(z.literal("")), callCta: optionalText(80), whatsappCta: optionalText(80) }).strict();
const textSectionSchema = z.object({ title: text(160), body: text(20_000) }).strict();
const aboutJourneySchema = z.object({ eyebrow: optionalText(80), title: text(120), milestones: z.array(z.object({ year: z.number().int().min(1900).max(2200), title: text(120), description: optionalText(240) }).strict()).max(12) }).strict();

export const pageSectionSchemas = {
  home: { hero: heroSchema, stats: statsSchema, services: homeServicesSchema, projects: homeProjectsSchema, why: homeWhySchema, process: processSchema, specialty: homeSpecialtySchema, faq: homeFaqSchema, estimator: homeEstimatorSchema, cta: ctaSchema },
  about: { story: textSectionSchema, mission: textSectionSchema, journey: aboutJourneySchema },
} as const;

export const pageSectionInputSchema = z.discriminatedUnion("sectionKey", [
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("hero"), content: heroSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("stats"), content: statsSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("services"), content: homeServicesSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("projects"), content: homeProjectsSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("why"), content: homeWhySchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("process"), content: processSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("specialty"), content: homeSpecialtySchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("faq"), content: homeFaqSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("estimator"), content: homeEstimatorSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("home"), sectionKey: z.literal("cta"), content: ctaSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("about"), sectionKey: z.literal("story"), content: textSectionSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("about"), sectionKey: z.literal("mission"), content: textSectionSchema, isVisible: z.boolean() }).strict(),
  z.object({ pageKey: z.literal("about"), sectionKey: z.literal("journey"), content: aboutJourneySchema, isVisible: z.boolean() }).strict(),
]);
export const pageSectionIdSchema = z.object({ pageKey: z.enum(["home", "about"]), sectionKey: z.string().min(1).max(40) }).strict();
export type PageSectionInput = z.infer<typeof pageSectionInputSchema>;
