import { describe, expect, it, vi } from "vitest";

const userUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "user-1" }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({
  prisma: {
    user: { update: userUpdate },
  },
}));

import { clearForcedPasswordChange } from "@/lib/auth/session-security";

describe("clearForcedPasswordChange", () => {
  it("clears the seeded password-change requirement for the authenticated user", async () => {
    await clearForcedPasswordChange("user-1");

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { mustChangePassword: false },
    });
  });
});
