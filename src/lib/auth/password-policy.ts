import { z } from "zod";

const COMMON_PASSWORDS = new Set([
  "123456789012",
  "password123",
  "password1234",
  "qwerty123456",
  "admin123456",
  "letmein1234",
  "welcome1234",
]);

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .refine((password) => !COMMON_PASSWORDS.has(password.toLowerCase()), "Choose a less common password.");

export function assertPasswordPolicy(password: string): void {
  passwordSchema.parse(password);
}
