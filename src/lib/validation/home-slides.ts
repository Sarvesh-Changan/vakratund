import { z } from "zod";

const plainText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Text is required.")
    .max(max)
    .refine((value) => !/[<>]/.test(value), "HTML is not allowed.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !/[<>]/.test(value), "HTML is not allowed.")
    .optional()
    .or(z.literal(""));

const linkUrlSchema = z
  .string()
  .trim()
  .max(500)
  .regex(/^(\/|https:\/\/)/, "Link must be an internal path (starting with '/') or an HTTPS URL.")
  .optional()
  .or(z.literal(""));

const sortOrderSchema = z.number().int().min(0).max(100_000);

export const createHomeSlideSchema = z
  .object({
    mediaId: z.string().cuid(),
    alt: plainText(300),
    title: optionalText(160),
    caption: optionalText(500),
    linkUrl: linkUrlSchema,
    isActive: z.boolean().default(true),
    sortOrder: sortOrderSchema.optional(),
    isPlaceholder: z.boolean().default(false),
    sourceName: optionalText(120),
    sourceUrl: z.string().url().max(500).optional().or(z.literal("")),
    license: optionalText(120),
  })
  .strict();

export const updateHomeSlideSchema = z
  .object({
    id: z.string().cuid(),
    mediaId: z.string().cuid().optional(),
    alt: plainText(300),
    title: optionalText(160),
    caption: optionalText(500),
    linkUrl: linkUrlSchema,
    isActive: z.boolean(),
    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

export const deleteHomeSlideSchema = z
  .object({
    id: z.string().cuid(),
    deleteCloudinaryAsset: z.boolean().default(false),
  })
  .strict();

export const toggleHomeSlideActiveSchema = z
  .object({
    id: z.string().cuid(),
    isActive: z.boolean(),
  })
  .strict();

export const reorderHomeSlideSchema = z
  .object({
    id: z.string().cuid(),
    direction: z.enum(["up", "down"]),
  })
  .strict();

export const setHomeSlideOrderSchema = z
  .object({
    orderedIds: z.array(z.string().cuid()),
  })
  .strict();

export const updateHomeShowcaseSettingsSchema = z
  .object({
    eyebrow: optionalText(80),
    heading: optionalText(160),
    speed: z.enum(["slow", "normal", "fast"]).default("normal"),
    pauseOnHover: z.boolean().default(true),
  })
  .strict();

export type CreateHomeSlideInput = z.infer<typeof createHomeSlideSchema>;
export type UpdateHomeSlideInput = z.infer<typeof updateHomeSlideSchema>;

