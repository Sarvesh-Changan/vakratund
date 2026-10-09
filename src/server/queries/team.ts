import "server-only";

import { unstable_cache } from "next/cache";

import type { MediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedTeamMember = {
  id: string;
  name: string;
  qualification: string | null;
  designation: string;
  experienceYrs: number | null;
  bio: string | null;
  sortOrder: number;
  photo: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null } | null;
};

const teamSelect = {
  id: true,
  name: true,
  qualification: true,
  designation: true,
  experienceYrs: true,
  bio: true,
  photoId: true,
  sortOrder: true,
} satisfies Prisma.TeamMemberSelect;

async function readVisibleTeam(): Promise<PublishedTeamMember[]> {
  const rows = await prisma.teamMember.findMany({ where: { isVisible: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: teamSelect });
  const ids = rows.flatMap((row) => row.photoId ? [row.photoId] : []);
  const assets = ids.length === 0 ? [] : await prisma.mediaAsset.findMany({ where: { id: { in: ids }, kind: "IMAGE" }, select: { id: true, kind: true, url: true, alt: true, width: true, height: true } });
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  return rows.map((row) => ({ id: row.id, name: row.name, qualification: row.qualification, designation: row.designation, experienceYrs: row.experienceYrs, bio: row.bio, sortOrder: row.sortOrder, photo: row.photoId ? assetsById.get(row.photoId) ?? null : null }));
}

export function getVisibleTeamMembers(): Promise<PublishedTeamMember[]> {
  return unstable_cache(readVisibleTeam, ["visible-team"], { tags: ["team"], revalidate: 3600 })();
}
