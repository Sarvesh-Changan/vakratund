import "server-only";

import { unstable_cache } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublicPageSection = { pageKey: string; sectionKey: string; content: Prisma.JsonValue; sortOrder: number };
async function readPageSections(pageKey: "home" | "about"): Promise<PublicPageSection[]> {
  const rows = await prisma.pageSection.findMany({ where: { pageKey, isVisible: true }, orderBy: { sortOrder: "asc" }, select: { pageKey: true, sectionKey: true, content: true, sortOrder: true } });
  return rows;
}
export function getPublicPageSections(pageKey: "home" | "about"): Promise<PublicPageSection[]> { return unstable_cache(() => readPageSections(pageKey), ["page-sections", pageKey], { tags: ["pages"], revalidate: 3600 })(); }
