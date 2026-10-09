import "server-only";

import { unstable_cache } from "next/cache";

import type { MediaKind, Prisma, ProjectStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedProjectMedia = {
  id: string;
  mediaId: string;
  kind: MediaKind;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  isCover: boolean;
  isBefore: boolean;
  isAfter: boolean;
  sortOrder: number;
};

export type PublishedProject = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  service: { id: string; title: string; slug: string } | null;
  locationText: string | null;
  areaSqft: number | null;
  floorsText: string | null;
  scopeText: string | null;
  year: number | null;
  status: ProjectStatus;
  progressPct: number | null;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDesc: string | null;
  media: PublishedProjectMedia[];
  clientName?: string | null;
};

export type PublishedProjectFilters = {
  serviceSlug?: string;
  status?: ProjectStatus;
  year?: number;
};

export type PublishedProjectsPage = {
  items: PublishedProject[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

const publicProjectSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  description: true,
  service: { select: { id: true, title: true, slug: true } },
  clientName: true,
  showClientName: true,
  locationText: true,
  areaSqft: true,
  floorsText: true,
  scopeText: true,
  year: true,
  status: true,
  progressPct: true,
  isFeatured: true,
  sortOrder: true,
  seoTitle: true,
  seoDesc: true,
  media: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      mediaId: true,
      isCover: true,
      isBefore: true,
      isAfter: true,
      sortOrder: true,
      media: { select: { kind: true, url: true, alt: true, width: true, height: true } },
    },
  },
} satisfies Prisma.ProjectSelect;

type PublicProjectRecord = Prisma.ProjectGetPayload<{ select: typeof publicProjectSelect }>;

export function toPublicProject(row: PublicProjectRecord): PublishedProject {
  const base = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    service: row.service,
    locationText: row.locationText,
    areaSqft: row.areaSqft,
    floorsText: row.floorsText,
    scopeText: row.scopeText,
    year: row.year,
    status: row.status,
    progressPct: row.progressPct,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
    seoTitle: row.seoTitle,
    seoDesc: row.seoDesc,
    media: row.media.map((item) => ({
      id: item.id,
      mediaId: item.mediaId,
      kind: item.media.kind,
      url: item.media.url,
      alt: item.media.alt,
      width: item.media.width,
      height: item.media.height,
      isCover: item.isCover,
      isBefore: item.isBefore,
      isAfter: item.isAfter,
      sortOrder: item.sortOrder,
    })),
  } satisfies Omit<PublishedProject, "clientName">;
  return row.showClientName ? { ...base, clientName: row.clientName } : base;
}

function publishedProjectWhere(filters: PublishedProjectFilters & { isFeatured?: boolean } = {}): Prisma.ProjectWhereInput {
  return {
    publishStatus: "PUBLISHED",
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.year ? { year: filters.year } : {}),
    ...(filters.isFeatured === undefined ? {} : { isFeatured: filters.isFeatured }),
    ...(filters.serviceSlug ? { service: { is: { slug: filters.serviceSlug } } } : {}),
  };
}

async function readPublishedProjects(filters: PublishedProjectFilters & { isFeatured?: boolean } = {}): Promise<PublishedProject[]> {
  const rows = await prisma.project.findMany({
    where: publishedProjectWhere(filters),
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { title: "asc" }],
    select: publicProjectSelect,
  });
  return rows.map(toPublicProject);
}

export function getPublishedProjects(filters: PublishedProjectFilters & { isFeatured?: boolean } = {}): Promise<PublishedProject[]> {
  const key = JSON.stringify(filters);
  return unstable_cache(() => readPublishedProjects(filters), ["published-projects", key], { tags: ["projects"], revalidate: 3600 })();
}

async function readPublishedProjectsPage(filters: PublishedProjectFilters, page: number, pageSize: number): Promise<PublishedProjectsPage> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(24, Math.max(1, Math.floor(pageSize)));
  const where = publishedProjectWhere(filters);
  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({ where, orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { title: "asc" }], skip: (safePage - 1) * safePageSize, take: safePageSize, select: publicProjectSelect }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, pageCount);
  const items = currentPage === safePage ? rows.map(toPublicProject) : await readPublishedProjectsPage(filters, currentPage, safePageSize).then((result) => result.items);
  return { items, page: currentPage, pageSize: safePageSize, total, pageCount };
}

export function getPublishedProjectsPage(filters: PublishedProjectFilters = {}, page = 1, pageSize = 9): Promise<PublishedProjectsPage> {
  const key = JSON.stringify({ filters, page, pageSize });
  const tags = ["projects", ...(filters.serviceSlug ? [`service:${filters.serviceSlug}`] : [])];
  return unstable_cache(() => readPublishedProjectsPage(filters, page, pageSize), ["published-projects-page", key], { tags, revalidate: 3600 })();
}

async function readPublishedProjectYears(): Promise<number[]> {
  const rows = await prisma.project.findMany({ where: { publishStatus: "PUBLISHED", year: { not: null } }, select: { year: true }, orderBy: { year: "desc" } });
  return [...new Set(rows.flatMap((row) => row.year === null ? [] : [row.year]))];
}

export const getPublishedProjectYears = unstable_cache(readPublishedProjectYears, ["published-project-years"], { tags: ["projects"], revalidate: 3600 });

async function readPublishedProject(slug: string): Promise<PublishedProject | null> {
  const row = await prisma.project.findFirst({ where: { slug, publishStatus: "PUBLISHED" }, select: publicProjectSelect });
  return row ? toPublicProject(row) : null;
}

export function getPublishedProject(slug: string): Promise<PublishedProject | null> {
  return unstable_cache(() => readPublishedProject(slug), ["published-project", slug], { tags: ["projects", `project:${slug}`], revalidate: 3600 })();
}
