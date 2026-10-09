import { describe, expect, it } from "vitest";

import { can, PERMISSIONS, type Permission } from "@/config/permissions";
import type { Role } from "@/generated/prisma/enums";

const roles: readonly Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "SALES"];

const expected: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: PERMISSIONS.filter((permission) => permission !== "users:manage"),
  EDITOR: ["content:write", "media:write", "seo:write", "dashboard:content"],
  SALES: ["leads:read", "leads:write", "dashboard:leads"],
};

describe("permission matrix", () => {
  it.each(roles.flatMap((role) => PERMISSIONS.map((permission) => [role, permission] as const)))
    ("checks %s against %s", (role, permission) => {
      expect(can(role, permission)).toBe(expected[role].includes(permission));
    });

  it("denies unknown runtime values", () => {
    expect(can("UNKNOWN" as Role, "users:manage")).toBe(false);
  });

  it("allows EDITOR service content mutations and denies SALES", () => {
    expect(can("EDITOR", "content:write")).toBe(true);
    expect(can("SALES", "content:write")).toBe(false);
  });

  it("forbids estimator mutations for EDITOR and SALES", () => {
    expect(can("EDITOR", "estimator:write")).toBe(false);
    expect(can("SALES", "estimator:write")).toBe(false);
  });

  it("restricts users:manage to SUPER_ADMIN", () => {
    expect(can("SUPER_ADMIN", "users:manage")).toBe(true);
    expect(can("ADMIN", "users:manage")).toBe(false);
    expect(can("EDITOR", "users:manage")).toBe(false);
    expect(can("SALES", "users:manage")).toBe(false);
  });
});
