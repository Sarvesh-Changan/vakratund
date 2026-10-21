"use server";

import { requireSession } from "@/lib/auth/session";
import { revokeOtherUserSessions } from "@/server/services/users";

export async function revokeOtherSessionsAction(): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    const count = await revokeOtherUserSessions(session.user.id, session.session.id, session.user.id);
    return { ok: true, count };
  } catch {
    return { ok: false, error: "Could not revoke other sessions." };
  }
}
