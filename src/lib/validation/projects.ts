import { z } from "zod";

import { ProjectStatus, PublishStatus } from "@/generated/prisma/enums";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalPlainText = (max: number) => plainText(max).optional().or(z.literal(""));
const optionalNumber = (min: number, max: number) => z.number().int().min(min).max(max).nullable();
const slug = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().toLowerCase().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.").optional(),
);

export const projectMediaInputSchema = z.object({
  mediaId: z.string().cuid(),
  isCover: z.boolean(),
  isBefore: z.boolean(),
  isAfter: z.boolean(),
  sortOrder: z.number().int().min(0).max(100_000),
}).strict();

const projectFields = {
  title: plainText(160),
  slug,
  summary: plainText(500),
  description: z.string().trim().max(20_000).optional().or(z.literal("")),
  serviceId: z.string().cuid().nullable(),
  clientName: optionalPlainText(160),
  showClientName: z.boolean().default(false),
  locationText: optionalPlainText(180),
  areaSqft: optionalNumber(1, 100_000_000),
  floorsText: optionalPlainText(120),
  scopeText: optionalPlainText(300),
  year: optionalNumber(1900, 2200),
  status: z.enum([ProjectStatus.COMPLETED, ProjectStatus.ONGOING]),
  progressPct: optionalNumber(0, 100),
  isFeatured: z.boolean(),
  publishStatus: z.enum([PublishStatus.DRAFT, PublishStatus.PUBLISHED, PublishStatus.ARCHIVED]),
  sortOrder: z.number().int().min(0).max(100_000),
  seoTitle: optionalPlainText(60),
  seoDesc: optionalPlainText(160),
  media: z.array(projectMediaInputSchema).max(100),
} satisfies z.ZodRawShape;

function withProjectRules<T extends z.ZodType>(schema: T) {
  return schema.superRefine((value, context) => {
    const project = value as { status: ProjectStatus; progressPct: number | null; media: { isCover: boolean }[] };
    if (project.status === ProjectStatus.ONGOING && project.progressPct === null) {
      context.addIssue({ code: "custom", path: ["progressPct"], message: "Progress is required for an ongoing project." });
    }
    if (project.status === ProjectStatus.COMPLETED && project.progressPct !== null) {
      context.addIssue({ code: "custom", path: ["progressPct"], message: "Progress is only used for ongoing projects." });
    }
    if (project.media.filter((item) => item.isCover).length > 1) {
      context.addIssue({ code: "custom", path: ["media"], message: "Choose only one cover image." });
    }
  });
}

export const createProjectSchema = withProjectRules(z.object(projectFields).strict());
export const updateProjectSchema = withProjectRules(z.object({ id: z.string().cuid(), ...projectFields }).strict());
export const deleteProjectSchema = z.object({ id: z.string().cuid() }).strict();
export const reorderProjectsSchema = z.object({ id: z.string().cuid(), direction: z.enum(["up", "down"]) }).strict();
export const togglePublishProjectSchema = z.object({ id: z.string().cuid(), published: z.boolean() }).strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectMediaInput = z.infer<typeof projectMediaInputSchema>;
export type ReorderProjectsInput = z.infer<typeof reorderProjectsSchema>;
export type TogglePublishProjectInput = z.infer<typeof togglePublishProjectSchema>;

