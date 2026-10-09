import type { Role } from "@/generated/prisma/enums";

export class LastSuperAdminError extends Error {
  constructor() {
    super("Cannot remove the last active SUPER_ADMIN.");
    this.name = "LastSuperAdminError";
  }
}

export function assertSuperAdminInvariant(input: {
  activeSuperAdminCount: number;
  currentRole: Role;
  currentIsActive: boolean;
  nextRole: Role;
  nextIsActive: boolean;
}): void {
  const remainsActiveSuperAdmin = input.nextRole === "SUPER_ADMIN" && input.nextIsActive;
  if (input.currentRole === "SUPER_ADMIN" && input.currentIsActive && !remainsActiveSuperAdmin && input.activeSuperAdminCount <= 1) {
    throw new LastSuperAdminError();
  }
}
