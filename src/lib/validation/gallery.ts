import { z } from "zod";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalPlainText = (max: number) => plainText(max).optional().or(z.literal(""));

const galleryFields = {
  mediaId: z.string().cuid(),
  category: plainText(80),
  title: optionalPlainText(160),
  sortOrder: z.number().int().min(0).max(100_000),
  isVisible: z.boolean(),
} satisfies z.ZodRawShape;

export const createGalleryItemSchema = z.object(galleryFields).strict();
export const updateGalleryItemSchema = z.object({ id: z.string().cuid(), ...galleryFields }).strict();
export const deleteGalleryItemSchema = z.object({ id: z.string().cuid() }).strict();
export const reorderGalleryItemsSchema = z.object({ id: z.string().cuid(), direction: z.enum(["up", "down"]) }).strict();
export const bulkAddGalleryItemsSchema = z.object({
  mediaIds: z.array(z.string().cuid()).min(1).max(100),
  category: plainText(80),
  title: optionalPlainText(160),
  isVisible: z.boolean(),
}).strict();

export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>;
export type ReorderGalleryItemsInput = z.infer<typeof reorderGalleryItemsSchema>;
export type BulkAddGalleryItemsInput = z.infer<typeof bulkAddGalleryItemsSchema>;

