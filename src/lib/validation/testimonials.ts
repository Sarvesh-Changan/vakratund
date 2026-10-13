import { z } from "zod";

import { PublishStatus } from "@/generated/prisma/enums";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalPlainText = (max: number) => plainText(max).optional().or(z.literal(""));

const testimonialFields = {
  name: plainText(100),
  roleOrOrg: optionalPlainText(160),
  quote: plainText(2_000),
  rating: z.number().int().min(1).max(5).nullable(),
  projectId: z.string().cuid().nullable(),
  photoId: z.string().cuid().nullable(),
  status: z.enum([PublishStatus.DRAFT, PublishStatus.PUBLISHED, PublishStatus.ARCHIVED]),
  sortOrder: z.number().int().min(0).max(100_000),
} satisfies z.ZodRawShape;

export const createTestimonialSchema = z.object(testimonialFields).strict();
export const updateTestimonialSchema = z.object({ id: z.string().cuid(), ...testimonialFields }).strict();
export const deleteTestimonialSchema = z.object({ id: z.string().cuid() }).strict();
export const reorderTestimonialsSchema = z.object({ id: z.string().cuid(), direction: z.enum(["up", "down"]) }).strict();
export const togglePublishTestimonialSchema = z.object({ id: z.string().cuid(), published: z.boolean() }).strict();

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
export type ReorderTestimonialsInput = z.infer<typeof reorderTestimonialsSchema>;
export type TogglePublishTestimonialInput = z.infer<typeof togglePublishTestimonialSchema>;
