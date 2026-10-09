import { NextResponse } from "next/server";
import { verifyBrochureToken } from "@/server/brochure-token";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return new NextResponse("Not found", { status: 404 });
  const verified = verifyBrochureToken(token);
  if (!verified) return new NextResponse("Link expired", { status: 410 });
  const media = await prisma.mediaAsset.findFirst({
    where: { id: verified.mediaId, kind: "DOCUMENT", format: "pdf" },
    select: { url: true },
  });
  if (!media) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(media.url, 302);
}
