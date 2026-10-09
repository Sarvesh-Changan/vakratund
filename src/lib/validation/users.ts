import { z } from "zod";

import { Role } from "@/generated/prisma/enums";
import { passwordSchema } from "@/lib/auth/password-policy";

const name = z.string().trim().min(1).max(100).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");
const role = z.enum([Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR, Role.SALES]);
export const createUserSchema = z.object({ name, email: z.string().trim().email().max(254), temporaryPassword: passwordSchema, role, mustChangePassword: z.boolean() }).strict();
export const updateUserSchema = z.object({ id: z.string().cuid(), name, email: z.string().trim().email().max(254), role, isActive: z.boolean() }).strict();
export const userIdSchema = z.object({ id: z.string().cuid() }).strict();
export const resetUserPasswordSchema = z.object({ id: z.string().cuid() }).strict();
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
