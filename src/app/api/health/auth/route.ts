import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/session";
import { loginRateLimitHealth } from "@/lib/rate-limit/login";
import { AuthHttpError } from "@/lib/auth/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiRole("SUPER_ADMIN");
    return NextResponse.json(await loginRateLimitHealth(request), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthHttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Authentication health is unavailable." }, { status: 503 });
  }
}
