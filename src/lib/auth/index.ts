export { auth } from "@/lib/auth/auth";
export { AuthHttpError } from "@/lib/auth/errors";
export { can, type Permission } from "@/lib/auth/permissions";
export {
  getSession,
  requireApiRole,
  requirePermission,
  requireRole,
  requireSession,
  type AuthMode,
  type AuthOptions,
  type AuthSession,
} from "@/lib/auth/session";
export { changeUserPassword, deactivateUser, revokeAllSessions, updateUserAccess, updateUserRole } from "@/lib/auth/session-security";
