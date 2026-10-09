import { NextResponse } from "next/server";

import { cloudinaryFolder, normalizeUploadFolder } from "@/lib/cloudinary/policy";
import { signUploadParameters } from "@/lib/cloudinary/signature";
import { requirePermission } from "@/lib/auth/session";
import { AuthHttpError } from "@/lib/auth/errors";
import { checkUploadSignatureLimit } from "@/lib/rate-limit";
import { signUploadRequestSchema } from "@/lib/validation/media";

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

export async function POST(request: Request) {
  const rate = checkUploadSignatureLimit(request);
  if (!rate.allowed) return NextResponse.json({ error: "Too many upload requests. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  try {
    await requirePermission("media:write", { mode: "api" });
    const body: unknown = await request.json();
    const parsed = signUploadRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    const folder = normalizeUploadFolder(parsed.data.folder);
    if (!folder) return NextResponse.json({ error: "Upload folder is not allowed." }, { status: 400 });

    const signed = signUploadParameters(folder, parsed.data.kind);
    return NextResponse.json({ api_key: signed.apiKey, cloud_name: signed.cloudName, folder: cloudinaryFolder(folder), timestamp: signed.timestamp, expiresAt: signed.expiresAt, signature: signed.signature, allowed_formats: signed.allowedFormats, ...(signed.transformation ? { transformation: signed.transformation } : {}) });
  } catch (error) {
    if (error instanceof AuthHttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Upload signing is unavailable." }, { status: 503 });
  }
}
