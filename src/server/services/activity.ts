import "server-only";

import { createHmac } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { getRequiredSecret } from "@/lib/env";

const SENSITIVE_KEY = /(password|token|hash|secret|authorization|cookie)/i;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type LogActivityInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  diff?: unknown;
  ipAddress?: string | null;
};

export type ActivityFilters = {
  q?: string;
  user?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

function sanitizeValue(value: unknown, seen: WeakSet<object>): JsonValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value !== "object") return undefined;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen) ?? null);
  }

  const result: Record<string, JsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) continue;
    const sanitized = sanitizeValue(item, seen);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

export function sanitizeActivityDiff(diff: unknown): Prisma.InputJsonValue | null {
  if (diff === undefined) return null;
  const sanitized = sanitizeValue(diff, new WeakSet<object>());
  return (sanitized ?? null) as Prisma.InputJsonValue | null;
}

function hashIp(ipAddress: string | null | undefined): string | null {
  if (!ipAddress) return null;
  return createHmac("sha256", getRequiredSecret("IP_HASH_SECRET")).update(ipAddress).digest("hex");
}

export async function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary ?? null,
      diff: sanitizeActivityDiff(input.diff) ?? undefined,
      ipHash: hashIp(input.ipAddress),
    },
  });
}

function parseDate(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return endOfDay ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : date;
}

export async function listActivity(filters: ActivityFilters = {}) {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const from = parseDate(filters.from);
  const to = parseDate(filters.to, true);
  const conditions: Prisma.ActivityLogWhereInput[] = [];
  if (filters.q) conditions.push({ OR: [
    { action: { contains: filters.q, mode: "insensitive" } },
    { entityType: { contains: filters.q, mode: "insensitive" } },
    { entityId: { contains: filters.q, mode: "insensitive" } },
    { summary: { contains: filters.q, mode: "insensitive" } },
  ] });
  if (filters.action) conditions.push({ action: { contains: filters.action, mode: "insensitive" } });
  if (filters.entity) conditions.push({ entityType: { contains: filters.entity, mode: "insensitive" } });
  if (filters.user) conditions.push({ OR: [
    { userId: { contains: filters.user, mode: "insensitive" } },
    { user: { is: { name: { contains: filters.user, mode: "insensitive" } } } },
    { user: { is: { email: { contains: filters.user, mode: "insensitive" } } } },
  ] });
  if (from || to) conditions.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } });
  const where: Prisma.ActivityLogWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [rows, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, action: true, entityType: true, entityId: true, summary: true, diff: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
