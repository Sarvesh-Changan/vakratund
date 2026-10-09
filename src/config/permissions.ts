import type { Role } from "@/generated/prisma/enums";

export type Permission =
  | "leads:read"
  | "leads:write"
  | "leads:export"
  | "leads:delete"
  | "estimator:write"
  | "content:write"
  | "media:write"
  | "seo:write"
  | "settings:write"
  | "users:manage"
  | "activity:read"
  | "dashboard:leads"
  | "dashboard:content";

export const PERMISSIONS = [
  "leads:read",
  "leads:write",
  "leads:export",
  "leads:delete",
  "estimator:write",
  "content:write",
  "media:write",
  "seo:write",
  "settings:write",
  "users:manage",
  "activity:read",
  "dashboard:leads",
  "dashboard:content",
] as const satisfies readonly Permission[];

type PermissionMatrix = Record<Role, Record<Permission, boolean>>;

export const permissionMatrix = {
  SUPER_ADMIN: {
    "leads:read": true,
    "leads:write": true,
    "leads:export": true,
    "leads:delete": true,
    "estimator:write": true,
    "content:write": true,
    "media:write": true,
    "seo:write": true,
    "settings:write": true,
    "users:manage": true,
    "activity:read": true,
    "dashboard:leads": true,
    "dashboard:content": true,
  },
  ADMIN: {
    "leads:read": true,
    "leads:write": true,
    "leads:export": true,
    "leads:delete": true,
    "estimator:write": true,
    "content:write": true,
    "media:write": true,
    "seo:write": true,
    "settings:write": true,
    "users:manage": false,
    "activity:read": true,
    "dashboard:leads": true,
    "dashboard:content": true,
  },
  EDITOR: {
    "leads:read": false,
    "leads:write": false,
    "leads:export": false,
    "leads:delete": false,
    "estimator:write": false,
    "content:write": true,
    "media:write": true,
    "seo:write": true,
    "settings:write": false,
    "users:manage": false,
    "activity:read": false,
    "dashboard:leads": false,
    "dashboard:content": true,
  },
  SALES: {
    "leads:read": true,
    "leads:write": true,
    "leads:export": false,
    "leads:delete": false,
    "estimator:write": false,
    "content:write": false,
    "media:write": false,
    "seo:write": false,
    "settings:write": false,
    "users:manage": false,
    "activity:read": false,
    "dashboard:leads": true,
    "dashboard:content": false,
  },
} satisfies PermissionMatrix;

export function can(role: Role, permission: Permission): boolean;
export function can(role: string, permission: string): boolean;
export function can(role: string, permission: string): boolean {
  if (!isRole(role) || !isPermission(permission)) return false;
  return permissionMatrix[role][permission];
}

export function isRole(value: unknown): value is Role {
  return value === "SUPER_ADMIN" || value === "ADMIN" || value === "EDITOR" || value === "SALES";
}

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (PERMISSIONS as readonly string[]).includes(value);
}
