import { z } from "zod";

export const leadStatusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"]);
export const leadTypeSchema = z.enum(["QUOTE", "CONTACT", "PROJECT_ENQUIRY", "BROCHURE", "INSPECTION"]);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").optional();

export const adminLeadFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: leadStatusSchema.optional(),
  type: leadTypeSchema.optional(),
  from: dateSchema,
  to: dateSchema,
  assignee: z.string().trim().max(100).optional(),
  sourcePage: z.string().trim().max(200).optional(),
  sort: z.enum(["createdAt", "name", "status", "type", "followUpAt"]).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const updateLeadStatusSchema = z.object({
  leadId: z.string().trim().min(1).max(100),
  status: leadStatusSchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

export const updateLeadAssignmentSchema = z.object({
  leadId: z.string().trim().min(1).max(100),
  assignedToId: z.string().trim().max(100).nullable(),
  followUpAt: z.string().datetime({ offset: true }).nullable(),
}).strict();

export const addLeadNoteSchema = z.object({
  leadId: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1, "Note cannot be empty.").max(2_000),
}).strict();

export const leadIdSchema = z.object({ leadId: z.string().trim().min(1).max(100) }).strict();
export const resendLeadEmailSchema = z.object({ leadId: z.string().trim().min(1).max(100), mode: z.enum(["admin", "visitor", "both"]) }).strict();

export type AdminLeadFilters = z.infer<typeof adminLeadFiltersSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type UpdateLeadAssignmentInput = z.infer<typeof updateLeadAssignmentSchema>;
export type AddLeadNoteInput = z.infer<typeof addLeadNoteSchema>;
export type ResendLeadEmailInput = z.infer<typeof resendLeadEmailSchema>;
