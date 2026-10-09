import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";

  if (!deep) {
    return NextResponse.json({
      status: "ok",
      time: new Date().toISOString(),
    });
  }

  try {
    await prisma.user.count({ where: { id: "__health_check__" } });
    return NextResponse.json({ db: "ok" as const });
  } catch {
    return NextResponse.json({ db: "fail" as const }, { status: 503 });
  }
}
