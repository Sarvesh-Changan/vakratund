import { NextResponse } from "next/server";

import { AuthHttpError } from "@/lib/auth/errors";
import { requireSession } from "@/lib/auth/session";
import { extendSession } from "@/lib/auth/session-timeout";
import { checkSessionExtendLimit } from "@/lib/rate-limit/session-extend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ code: "INVALID_ORIGIN", message: "Invalid request origin." }, { status: 403 });
  try {
    const session = await requireSession({ mode: "api", activity: "passive" });
    const limit = await checkSessionExtendLimit(request, session.user.id);
    if (!limit.allowed) return NextResponse.json({ code: "RATE_LIMITED", message: "Please wait before extending the session again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
    const remaining = await extendSession(session.session.id);
    if (!remaining) return NextResponse.json({ code: "SESSION_EXPIRED", message: "Session expired." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(remaining, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthHttpError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ code: "AUTH_UNAVAILABLE", message: "Authentication service unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
