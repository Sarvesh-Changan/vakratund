import { describe, expect, it } from "vitest";

import { assertSuperAdminInvariant } from "@/lib/auth/super-admin-guard";

describe("last active SUPER_ADMIN guard", () => {
  it.each([
    [1, "SUPER_ADMIN", true, "ADMIN", true, true],
    [1, "SUPER_ADMIN", true, "SUPER_ADMIN", false, true],
    [2, "SUPER_ADMIN", true, "ADMIN", true, false],
    [1, "ADMIN", true, "EDITOR", true, false],
  ] as const)("enforces the invariant", (activeSuperAdminCount, currentRole, currentIsActive, nextRole, nextIsActive, shouldThrow) => {
    const action = () => assertSuperAdminInvariant({ activeSuperAdminCount, currentRole, currentIsActive, nextRole, nextIsActive });
    if (shouldThrow) expect(action).toThrow("last active SUPER_ADMIN");
    else expect(action).not.toThrow();
  });
});
