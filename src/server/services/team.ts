import "server-only";

import type { MediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { CreateTeamMemberInput, ReorderTeamMembersInput, ToggleTeamVisibilityInput, UpdateTeamMemberInput } from "@/lib/validation/team";
import { logActivity } from "@/server/services/activity";

export type TeamMemberView = {
  id: string;
  name: string;
  qualification: string | null;
  designation: string;
  experienceYrs: number | null;
  bio: string | null;
  photoId: string | null;
  photo: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null } | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

type TeamRecord = Prisma.TeamMemberGetPayload<{ select: typeof teamSelect }>;

export class TeamMemberNotFoundError extends Error {
  constructor() { super("Team member not found."); this.name = "TeamMemberNotFoundError"; }
}

export class TeamPhotoNotFoundError extends Error {
  constructor() { super("The selected team photo no longer exists."); this.name = "TeamPhotoNotFoundError"; }
}

export class TeamPhotoMustBeImageError extends Error {
  constructor() { super("Team photos must be image media."); this.name = "TeamPhotoMustBeImageError"; }
}

const teamSelect = {
  id: true,
  name: true,
  qualification: true,
  designation: true,
  experienceYrs: true,
  bio: true,
  photoId: true,
  sortOrder: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TeamMemberSelect;

type TeamPhoto = TeamMemberView["photo"];

function toView(record: TeamRecord, photo: TeamPhoto = null): TeamMemberView {
  return { ...record, photo, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}

function nullableString(value: string | undefined): string | null { return value?.trim() ? value.trim() : null; }

async function validatePhoto(photoId: string | null): Promise<void> {
  if (!photoId) return;
  const photo = await prisma.mediaAsset.findUnique({ where: { id: photoId }, select: { id: true, kind: true } });
  if (!photo) throw new TeamPhotoNotFoundError();
  if (photo.kind !== "IMAGE") throw new TeamPhotoMustBeImageError();
}

async function photoFor(photoId: string | null): Promise<TeamPhoto> {
  if (!photoId) return null;
  const photo = await prisma.mediaAsset.findUnique({ where: { id: photoId }, select: { id: true, kind: true, url: true, alt: true, width: true, height: true } });
  return photo?.kind === "IMAGE" ? photo : null;
}

function inputData(input: CreateTeamMemberInput | UpdateTeamMemberInput): Prisma.TeamMemberUncheckedCreateInput {
  return { name: input.name, qualification: nullableString(input.qualification), designation: input.designation, experienceYrs: input.experienceYrs, bio: nullableString(input.bio), photoId: input.photoId, sortOrder: input.sortOrder, isVisible: input.isVisible };
}

export async function listTeamMembers(filters: { q?: string; visibleOnly?: boolean } = {}): Promise<TeamMemberView[]> {
  const q = filters.q?.trim();
  const rows = await prisma.teamMember.findMany({
    where: { ...(filters.visibleOnly ? { isVisible: true } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { designation: { contains: q, mode: "insensitive" } }, { qualification: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: teamSelect,
  });
  const photos = await Promise.all(rows.map((row) => photoFor(row.photoId)));
  return rows.map((row, index) => toView(row, photos[index]));
}

export async function getTeamMember(id: string): Promise<TeamMemberView | null> {
  const row = await prisma.teamMember.findUnique({ where: { id }, select: teamSelect });
  return row ? toView(row, await photoFor(row.photoId)) : null;
}

export async function createTeamMember(input: CreateTeamMemberInput, userId: string): Promise<TeamMemberView> {
  await validatePhoto(input.photoId);
  const row = await prisma.teamMember.create({ data: inputData(input), select: teamSelect });
  await logActivity({ userId, action: "team.create", entityType: "TeamMember", entityId: row.id, summary: `Created team member ${row.name}`, diff: { isVisible: row.isVisible, photoId: row.photoId } });
  return toView(row, await photoFor(row.photoId));
}

export async function updateTeamMember(input: UpdateTeamMemberInput, userId: string): Promise<TeamMemberView> {
  const current = await prisma.teamMember.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new TeamMemberNotFoundError();
  await validatePhoto(input.photoId);
  const row = await prisma.teamMember.update({ where: { id: input.id }, data: inputData(input), select: teamSelect });
  await logActivity({ userId, action: "team.update", entityType: "TeamMember", entityId: row.id, summary: `Updated team member ${row.name}`, diff: { isVisible: row.isVisible, photoId: row.photoId } });
  return toView(row, await photoFor(row.photoId));
}

export async function deleteTeamMember(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const row = await prisma.teamMember.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!row) throw new TeamMemberNotFoundError();
  await prisma.teamMember.delete({ where: { id } });
  await logActivity({ userId, action: "team.delete", entityType: "TeamMember", entityId: id, summary: `Deleted team member ${row.name}` });
  return { deleted: true, id };
}

export async function reorderTeamMembers(input: ReorderTeamMembersInput, userId: string): Promise<TeamMemberView[]> {
  const rows = await prisma.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const current = rows[index];
  const neighbor = rows[input.direction === "up" ? index - 1 : index + 1];
  if (!current || !neighbor) return listTeamMembers();
  await prisma.$transaction([
    prisma.teamMember.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder }, select: { id: true } }),
    prisma.teamMember.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder }, select: { id: true } }),
  ]);
  await logActivity({ userId, action: "team.reorder", entityType: "TeamMember", entityId: current.id, summary: `Moved team member ${input.direction}`, diff: { direction: input.direction } });
  return listTeamMembers();
}

export async function toggleTeamVisibility(input: ToggleTeamVisibilityInput, userId: string): Promise<TeamMemberView> {
  const current = await prisma.teamMember.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new TeamMemberNotFoundError();
  const row = await prisma.teamMember.update({ where: { id: input.id }, data: { isVisible: input.visible }, select: teamSelect });
  await logActivity({ userId, action: "team.toggleVisibility", entityType: "TeamMember", entityId: row.id, summary: `${row.isVisible ? "Published" : "Hidden"} team member ${row.name}`, diff: { isVisible: row.isVisible } });
  return toView(row, await photoFor(row.photoId));
}
