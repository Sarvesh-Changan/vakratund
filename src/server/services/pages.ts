import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { pageSectionInputSchema, type PageSectionInput } from "@/lib/validation/pages";
import { logActivity } from "@/server/services/activity";

export type PageSectionView = { id: string; pageKey: string; sectionKey: string; content: Prisma.JsonValue; sortOrder: number; isVisible: boolean; updatedAt: string };

const sectionSelect = { id: true, pageKey: true, sectionKey: true, content: true, sortOrder: true, isVisible: true, updatedAt: true } satisfies Prisma.PageSectionSelect;
function toView(row: Prisma.PageSectionGetPayload<{ select: typeof sectionSelect }>): PageSectionView { return { ...row, updatedAt: row.updatedAt.toISOString() }; }

export async function listPageSections(pageKey?: "home" | "about"): Promise<PageSectionView[]> {
  const rows = await prisma.pageSection.findMany({ where: pageKey ? { pageKey } : {}, orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }], select: sectionSelect });
  return rows.map(toView);
}

export async function savePageSection(input: PageSectionInput, userId: string): Promise<PageSectionView> {
  const parsed = pageSectionInputSchema.parse(input);
  const row = await prisma.pageSection.upsert({ where: { pageKey_sectionKey: { pageKey: parsed.pageKey, sectionKey: parsed.sectionKey } }, create: { pageKey: parsed.pageKey, sectionKey: parsed.sectionKey, content: parsed.content as Prisma.InputJsonValue, isVisible: parsed.isVisible }, update: { content: parsed.content as Prisma.InputJsonValue, isVisible: parsed.isVisible }, select: sectionSelect });
  await logActivity({ userId, action: "pageSection.save", entityType: "PageSection", entityId: row.id, summary: `Saved ${parsed.pageKey} ${parsed.sectionKey} content section`, diff: { pageKey: parsed.pageKey, sectionKey: parsed.sectionKey, isVisible: parsed.isVisible } });
  return toView(row);
}
