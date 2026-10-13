import { z } from "zod";

import { GalleryDesignType, GalleryMediaType } from "@/generated/prisma/enums";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const order = z.number().int().min(0).max(100_000);
const slug = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().toLowerCase().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.").optional(),
);

export const createGalleryCategorySchema = z.object({ name: plainText(80), slug, sortOrder: order }).strict();
export const updateGalleryCategorySchema = z.object({ id: z.string().cuid(), name: plainText(80), slug, sortOrder: order }).strict();
export const deleteGalleryCategorySchema = z.object({ id: z.string().cuid() }).strict();
export const reorderGalleryCategorySchema = z.object({ id: z.string().cuid(), direction: z.enum(["up", "down"]) }).strict();

const galleryItemFields = {
  assetId: z.string().cuid(),
  title: plainText(160),
  categoryId: z.string().cuid(),
  designType: z.enum([GalleryDesignType.INTERIOR, GalleryDesignType.EXTERIOR]),
  isCategoryCover: z.boolean(),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: order,
  duration: z.number().positive().max(86_400).optional().nullable(),
  keepDuplicate: z.boolean().optional().default(false),
} satisfies z.ZodRawShape;

export const createGalleryItemSchema = z.object(galleryItemFields).strict();
export const updateGalleryItemSchema = z.object({ id: z.string().cuid(), title: plainText(160), categoryId: z.string().cuid(), designType: z.enum([GalleryDesignType.INTERIOR, GalleryDesignType.EXTERIOR]), isCategoryCover: z.boolean(), isFeatured: z.boolean(), isPublished: z.boolean(), sortOrder: order }).strict();
export const deleteGalleryItemSchema = z.object({ id: z.string().cuid() }).strict();
export const reorderGalleryItemSchema = z.object({ id: z.string().cuid(), direction: z.enum(["up", "down"]) }).strict();
export const toggleGalleryItemSchema = z.object({ id: z.string().cuid(), flag: z.enum(["isCategoryCover", "isFeatured", "isPublished"]), value: z.boolean() }).strict();
export const galleryDuplicateSchema = z.object({ etag: z.string().trim().min(1).max(128), excludeId: z.string().cuid().optional() }).strict();
export const syncGalleryMetadataSchema = z.object({}).strict();

export const galleryFilterSchema = z.object({
  categoryId: z.string().cuid().optional(),
  designType: z.enum([GalleryDesignType.INTERIOR, GalleryDesignType.EXTERIOR]).optional(),
  mediaType: z.enum([GalleryMediaType.IMAGE, GalleryMediaType.VIDEO]).optional(),
  isPublished: z.enum(["true", "false", "all"]).optional(),
}).strict();

export type CreateGalleryCategoryInput = z.infer<typeof createGalleryCategorySchema>;
export type UpdateGalleryCategoryInput = z.infer<typeof updateGalleryCategorySchema>;
export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>;
export type ToggleGalleryItemInput = z.infer<typeof toggleGalleryItemSchema>;
export type ReorderGalleryItemInput = z.infer<typeof reorderGalleryItemSchema>;
export type GalleryFilterInput = z.infer<typeof galleryFilterSchema>;
