import { z } from "zod";

const plainText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const optionalPlainText = (max: number) => plainText(max).optional().or(z.literal(""));

const teamFields = {
  name: plainText(100),
  qualification: optionalPlainText(160),
  designation: plainText(120),
  experienceYrs: z.number().int().min(0).max(100).nullable(),
  bio: z.string().trim().max(2_000).optional().or(z.literal("")),
  photoId: z.string().cuid().nullable(),
  sortOrder: z.number().int().min(0).max(100_000),
  isVisible: z.boolean(),
} satisfies z.ZodRawShape;

export const createTeamMemberSchema = z.object(teamFields).strict();
export const updateTeamMemberSchema = z.object({ id: z.string().cuid(), ...teamFields }).strict();
export const deleteTeamMemberSchema = z.object({ id: z.string().cuid() }).strict();
export const reorderTeamMembersSchema = z.object({ id: z.string().cuid(), direction: z.enum(["up", "down"]) }).strict();
export const toggleTeamVisibilitySchema = z.object({ id: z.string().cuid(), visible: z.boolean() }).strict();

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type ReorderTeamMembersInput = z.infer<typeof reorderTeamMembersSchema>;
export type ToggleTeamVisibilityInput = z.infer<typeof toggleTeamVisibilitySchema>;
