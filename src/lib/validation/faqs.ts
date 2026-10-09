import { z } from "zod";

import { PublishStatus } from "@/generated/prisma/enums";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");

const faqFields = {
  question: plainText(300),
  answer: z.string().trim().min(1).max(20_000),
  serviceId: z.string().cuid().nullable(),
  status: z.enum([PublishStatus.DRAFT, PublishStatus.PUBLISHED, PublishStatus.ARCHIVED]),
  sortOrder: z.number().int().min(0).max(100_000),
} satisfies z.ZodRawShape;

export const createFaqSchema = z.object(faqFields).strict();
export const updateFaqSchema = z.object({ id: z.string().cuid(), ...faqFields }).strict();
export const deleteFaqSchema = z.object({ id: z.string().cuid() }).strict();
export const reorderFaqsSchema = z.object({ id: z.string().cuid(), direction: z.enum(["up", "down"]) }).strict();
export const togglePublishFaqSchema = z.object({ id: z.string().cuid(), published: z.boolean() }).strict();

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type ReorderFaqsInput = z.infer<typeof reorderFaqsSchema>;
export type TogglePublishFaqInput = z.infer<typeof togglePublishFaqSchema>;
