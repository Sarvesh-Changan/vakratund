import { NextResponse } from "next/server";

import { cloudinaryFolder, normalizeUploadSection, uploadPolicy } from "@/lib/cloudinary/policy";
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

async function requireUploadPermission() {
  try {
    return await requirePermission("media:write", { mode: "api" });
  } catch (error) {
    if (error instanceof AuthHttpError && error.status === 403) return requirePermission("content:write", { mode: "api" });
    throw error;
  }
}

export async function POST(request: Request) {
  const rate = checkUploadSignatureLimit(request);
  if (!rate.allowed) return NextResponse.json({ error: "Too many upload requests. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  try {
    await requireUploadPermission();
    const body: unknown = await request.json();
    const parsed = signUploadRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    const section = normalizeUploadSection(parsed.data.section);
    if (!section) return NextResponse.json({ error: "Upload section is not allowed." }, { status: 400 });
    if (!uploadPolicy(section, parsed.data.kind)) return NextResponse.json({ error: "This media kind is not allowed in the selected section." }, { status: 400 });

    const signed = signUploadParameters(section, parsed.data.kind);
    if (process.env.NODE_ENV !== "production") console.info("Cloudinary upload signature generated", { section, signedParameterNames: signed.signedParameterNames });
    return NextResponse.json({ api_key: signed.apiKey, cloud_name: signed.cloudName, resource_type: signed.resourceType, section, folder: cloudinaryFolder(section), timestamp: signed.timestamp, expiresAt: signed.expiresAt, signature: signed.signature, allowed_formats: signed.allowedFormats, signed_parameter_names: signed.signedParameterNames, ...(signed.transformation ? { transformation: signed.transformation } : {}) });
  } catch (error) {
    if (error instanceof AuthHttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Upload signing is unavailable." }, { status: 503 });
  }
}
