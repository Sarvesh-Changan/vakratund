import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const createRecord = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/team", () => ({ createTeamMember: createRecord, deleteTeamMember: vi.fn(), getTeamMember: vi.fn(), reorderTeamMembers: vi.fn(), toggleTeamVisibility: vi.fn(), updateTeamMember: vi.fn(), TeamMemberNotFoundError: class TeamMemberNotFoundError extends Error {}, TeamPhotoMustBeImageError: class TeamPhotoMustBeImageError extends Error {}, TeamPhotoNotFoundError: class TeamPhotoNotFoundError extends Error {} }));

import { createTeamMember } from "@/app/(admin)/admin/(protected)/team/actions";

const validInput = { name: "Er. Salil S. Chawan", qualification: "B.E. (Construction)", designation: "Proprietor", experienceYrs: 25, bio: "", photoId: null, sortOrder: 0, isVisible: true };

describe("team action authorization", () => {
  beforeEach(() => { vi.clearAllMocks(); createRecord.mockResolvedValue({ id: "team-1" }); });
  it("allows EDITOR content mutations", async () => { requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } }); const result = await createTeamMember(validInput); expect(result.ok).toBe(true); expect(createRecord).toHaveBeenCalledWith(expect.objectContaining({ name: "Er. Salil S. Chawan" }), "editor-1"); });
  it("denies SALES before validation or execution", async () => { requirePermission.mockRejectedValue(new Error("Forbidden")); await expect(createTeamMember({})).rejects.toThrow("Forbidden"); expect(createRecord).not.toHaveBeenCalled(); });
});
