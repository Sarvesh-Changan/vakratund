import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";

async function readBrochureMedia() {
  const settings = await prisma.siteSetting.findUnique({
    where: { id: "singleton" },
    select: { brochureMediaId: true },
  });
  if (!settings?.brochureMediaId) return null;
  const media = await prisma.mediaAsset.findFirst({
    where: { id: settings.brochureMediaId, kind: "DOCUMENT", format: "pdf" },
    select: { id: true, url: true },
  });
  return media;
}

export const getPublicBrochureMedia = unstable_cache(
  readBrochureMedia,
  ["public-brochure-media"],
  { tags: ["settings"], revalidate: 3600 },
);

export async function getBrochureMediaId(): Promise<string | null> {
  return (await getPublicBrochureMedia())?.id ?? null;
}
