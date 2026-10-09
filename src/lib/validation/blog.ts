import { z } from "zod";

import { PublishStatus } from "@/generated/prisma/enums";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalPlainText = (max: number) => plainText(max).optional().or(z.literal(""));
const slug = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().toLowerCase().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.").optional(),
);
const optionalDate = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "string") return new Date(value);
    return value;
  },
  z.date().nullable(),
);

const postFields = {
  title: plainText(160),
  slug,
  excerpt: plainText(500),
  content: z.string().trim().min(1).max(100_000),
  coverId: z.string().cuid().nullable(),
  categoryId: z.string().cuid().nullable(),
  authorId: z.string().cuid().nullable(),
  status: z.enum([PublishStatus.DRAFT, PublishStatus.PUBLISHED, PublishStatus.ARCHIVED]),
  publishedAt: optionalDate,
  seoTitle: optionalPlainText(60),
  seoDesc: optionalPlainText(160),
} satisfies z.ZodRawShape;

export const createBlogPostSchema = z.object(postFields).strict();
export const updateBlogPostSchema = z.object({ id: z.string().cuid(), ...postFields }).strict();
export const deleteBlogPostSchema = z.object({ id: z.string().cuid() }).strict();
export const togglePublishBlogPostSchema = z.object({ id: z.string().cuid(), published: z.boolean() }).strict();

const categoryFields = { name: plainText(100), slug } satisfies z.ZodRawShape;

export const createBlogCategorySchema = z.object(categoryFields).strict();
export const updateBlogCategorySchema = z.object({ id: z.string().cuid(), ...categoryFields }).strict();
export const deleteBlogCategorySchema = z.object({ id: z.string().cuid() }).strict();

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type TogglePublishBlogPostInput = z.infer<typeof togglePublishBlogPostSchema>;
export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
