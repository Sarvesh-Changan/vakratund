import "server-only";

import type { LeadStatus, LeadType, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/client";

const DAY_MS = 24 * 60 * 60 * 1000;

type LeadWhere = { deletedAt: null; createdAt?: { gte: Date } };

export type LeadDayCount = { date: string; count: number };
export type CountEntry = { label: string; count: number };
export type RecentLead = { id: string; name: string; type: LeadType; status: LeadStatus; sourcePage: string | null; createdAt: Date };

export type LeadDashboardData = {
  kind: "leads";
  kpis: {
    newToday: number;
    newLast7Days: number;
    newLast30Days: number;
    conversionRate: number;
    quoteCount: number;
    estimatedLowTotal: number;
    estimatedHighTotal: number;
  };
  leadsByDay: LeadDayCount[];
  leadsByStatus: CountEntry[];
  leadsBySourcePage: CountEntry[];
  leadsByType: CountEntry[];
  recentLeads: RecentLead[];
};

export type ContentDashboardData = {
  kind: "content";
  publishedCount: number;
  draftCount: number;
};

export type DashboardData = LeadDashboardData | ContentDashboardData;

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function subtractDays(value: Date, days: number): Date {
  return new Date(value.getTime() - days * DAY_MS);
}

function nextDay(value: Date): Date {
  return new Date(value.getTime() + DAY_MS);
}

function dateLabel(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export async function getLeadDashboardData(db: typeof prisma = prisma): Promise<LeadDashboardData> {
  const today = startOfUtcDay(new Date());
  const sevenDayStart = subtractDays(today, 6);
  const thirtyDayStart = subtractDays(today, 29);
  const activeLeads: LeadWhere = { deletedAt: null };
  const thirtyDayLeads: LeadWhere = { deletedAt: null, createdAt: { gte: thirtyDayStart } };

  const [newToday, newLast7Days, newLast30Days, convertedLast30Days, quoteSummary, statusGroups, sourceGroups, typeGroups, recentLeads, leadsByDay] = await Promise.all([
    db.lead.count({ where: { ...activeLeads, createdAt: { gte: today } } }),
    db.lead.count({ where: { ...activeLeads, createdAt: { gte: sevenDayStart } } }),
    db.lead.count({ where: thirtyDayLeads }),
    db.lead.count({ where: { ...thirtyDayLeads, status: "CONVERTED" } }),
    db.quote.aggregate({ _count: { _all: true }, _sum: { lowAmount: true, highAmount: true } }),
    db.lead.groupBy({ by: ["status"], where: thirtyDayLeads, _count: { _all: true } }),
    db.lead.groupBy({ by: ["sourcePage"], where: thirtyDayLeads, _count: { _all: true }, orderBy: { _count: { sourcePage: "desc" } }, take: 5 }),
    db.lead.groupBy({ by: ["type"], where: thirtyDayLeads, _count: { _all: true }, orderBy: { _count: { type: "desc" } } }),
    db.lead.findMany({ where: activeLeads, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, name: true, type: true, status: true, sourcePage: true, createdAt: true } }),
    Promise.all(Array.from({ length: 30 }, (_, index) => {
      const date = subtractDays(today, 29 - index);
      return db.lead.count({ where: { ...activeLeads, createdAt: { gte: date, lt: nextDay(date) } } }).then((count) => ({ date: dateLabel(date), count }));
    })),
  ]);

  return {
    kind: "leads",
    kpis: {
      newToday,
      newLast7Days,
      newLast30Days,
      conversionRate: newLast30Days === 0 ? 0 : convertedLast30Days / newLast30Days,
      quoteCount: quoteSummary._count._all,
      estimatedLowTotal: quoteSummary._sum.lowAmount ?? 0,
      estimatedHighTotal: quoteSummary._sum.highAmount ?? 0,
    },
    leadsByDay,
    leadsByStatus: statusGroups.map((group) => ({ label: group.status, count: group._count._all })),
    leadsBySourcePage: sourceGroups.map((group) => ({ label: group.sourcePage ?? "Unknown page", count: group._count._all })),
    leadsByType: typeGroups.map((group) => ({ label: group.type, count: group._count._all })),
    recentLeads,
  };
}

export async function getContentDashboardData(db: typeof prisma = prisma): Promise<ContentDashboardData> {
  const [publishedServices, publishedProjects, draftServices, draftProjects] = await Promise.all([
    db.service.count({ where: { status: "PUBLISHED" } }),
    db.project.count({ where: { publishStatus: "PUBLISHED" } }),
    db.service.count({ where: { status: "DRAFT" } }),
    db.project.count({ where: { publishStatus: "DRAFT" } }),
  ]);

  return { kind: "content", publishedCount: publishedServices + publishedProjects, draftCount: draftServices + draftProjects };
}

export async function getDashboardData(role: Role, db: typeof prisma = prisma): Promise<DashboardData> {
  return role === "EDITOR" ? getContentDashboardData(db) : getLeadDashboardData(db);
}
