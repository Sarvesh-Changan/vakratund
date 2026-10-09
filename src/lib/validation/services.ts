import { z } from "zod";

import { PublishStatus } from "@/generated/prisma/enums";

export const SERVICE_ICON_KEYS = [
  "Building2",
  "HardHat",
  "Ruler",
  "Wrench",
  "Paintbrush",
  "Droplets",
  "House",
  "Road",
  "Landmark",
  "PanelsTopLeft",
  "ShieldCheck",
] as const;

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalPlainText = (max: number) => plainText(max).optional().or(z.literal(""));
const slug = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().toLowerCase().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.").optional(),
);

const serviceFields = {
  title: plainText(120),
  slug,
  shortDesc: plainText(300),
  description: z.string().trim().min(1).max(20_000),
  scopeItems: z.array(plainText(180)).min(1).max(20),
  iconKey: z.enum(SERVICE_ICON_KEYS).nullable(),
  coverId: z.string().cuid().nullable(),
  isFeatured: z.boolean(),
  status: z.enum([PublishStatus.DRAFT, PublishStatus.PUBLISHED, PublishStatus.ARCHIVED]),
  sortOrder: z.number().int().min(0).max(100_000),
  seoTitle: optionalPlainText(60),
  seoDesc: optionalPlainText(160),
} satisfies z.ZodRawShape;

export const createServiceSchema = z.object(serviceFields).strict();
export const updateServiceSchema = z.object({ id: z.string().cuid(), ...serviceFields }).strict();
export const deleteServiceSchema = z.object({ id: z.string().cuid() }).strict();
export const reorderServicesSchema = z.object({
  id: z.string().cuid(),
  direction: z.enum(["up", "down"]),
}).strict();
export const togglePublishServiceSchema = z.object({
  id: z.string().cuid(),
  published: z.boolean(),
}).strict();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ReorderServicesInput = z.infer<typeof reorderServicesSchema>;
export type TogglePublishServiceInput = z.infer<typeof togglePublishServiceSchema>;
