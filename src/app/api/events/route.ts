import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { checkContactEventLimit, hashRequestIp } from "@/lib/rate-limit/contact-events";
import { contactEventSchema } from "@/lib/validation/contact-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const rate = checkContactEventLimit(request);
  if (!rate.allowed) return NextResponse.json({ error: "Too many events. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const parsed = contactEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event." }, { status: 400 });

  try {
    await prisma.contactEvent.create({ data: { type: parsed.data.type, pagePath: parsed.data.pagePath, context: parsed.data.context || null, ipHash: hashRequestIp(request) } });
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Event tracking is unavailable." }, { status: 503 });
  }
}
