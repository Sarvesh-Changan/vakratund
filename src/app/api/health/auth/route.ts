import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/session";
import { loginRateLimitHealth } from "@/lib/rate-limit/login";
import { AuthHttpError } from "@/lib/auth/errors";
import { sessionTimeoutConfig } from "@/lib/auth/session-timeout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiRole("SUPER_ADMIN");
    const health = await loginRateLimitHealth(request);
    const timeout = sessionTimeoutConfig();
    return NextResponse.json({ ...health, session: { idleTimeoutMinutes: timeout.idleTimeoutMs / 60_000, warningMinutes: timeout.warningMs / 60_000, absoluteTimeoutHours: timeout.absoluteTimeoutMs / 3_600_000 }, clientIp: { resolved: health.clientIpResolved, source: health.clientIpSource } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthHttpError) return NextResponse.json({ code: error.code, error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Authentication health is unavailable." }, { status: 503 });
  }
}
