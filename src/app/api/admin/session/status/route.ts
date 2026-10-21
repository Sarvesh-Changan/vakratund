import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { findSessionRecord, sessionRemaining, sessionTimeoutConfig } from "@/lib/auth/session-timeout";
import { AuthHttpError } from "@/lib/auth/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession({ mode: "api", activity: "passive" });
    const record = await findSessionRecord(session.session.id);
    if (!record) return NextResponse.json({ code: "SESSION_EXPIRED", message: "Session expired." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(sessionRemaining(record, Date.now(), sessionTimeoutConfig()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthHttpError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ code: "AUTH_UNAVAILABLE", message: "Authentication service unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
