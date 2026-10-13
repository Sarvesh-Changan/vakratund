import { z } from "zod";
import { NextResponse } from "next/server";

import { AuthHttpError } from "@/lib/auth/errors";
import { requirePermission } from "@/lib/auth/session";

const uploadErrorSchema = z.object({
  message: z.string().trim().min(1).max(300),
  signedParameterNames: z.array(z.string().trim().min(1).max(40)).max(20),
}).strict();

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function requireUploadPermission() {
  try {
    return await requirePermission("media:write", { mode: "api" });
  } catch (error) {
    if (error instanceof AuthHttpError && error.status === 403) return requirePermission("content:write", { mode: "api" });
    throw error;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    await requireUploadPermission();
    const parsed = uploadErrorSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid upload error report." }, { status: 400 });
    if (process.env.NODE_ENV !== "production") {
      console.warn("Cloudinary upload rejected", {
        message: parsed.data.message.replace(/[\r\n]/g, " "),
        signedParameterNames: parsed.data.signedParameterNames,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthHttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Upload error reporting is unavailable." }, { status: 503 });
  }
}
