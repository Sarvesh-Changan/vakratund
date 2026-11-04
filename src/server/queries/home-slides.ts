import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";

export type PublicHomeSlide = {
  id: string;
  alt: string;
  title: string | null;
  caption: string | null;
  linkUrl: string | null;
  sortOrder: number;
  media: {
    url: string;
    alt: string;
    width: number | null;
    height: number | null;
    format: string | null;
  };
};

async function readActiveHomeSlides(): Promise<PublicHomeSlide[]> {
  try {
    const slides = await prisma.homeSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        alt: true,
        title: true,
        caption: true,
        linkUrl: true,
        sortOrder: true,
        media: {
          select: {
            url: true,
            alt: true,
            width: true,
            height: true,
            format: true,
          },
        },
      },
    });

    return slides;
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") return [];
    throw error;
  }
}

export const getActiveHomeSlides = unstable_cache(readActiveHomeSlides, ["active-home-slides"], {
  tags: ["homeSlider"],
  revalidate: 3600,
});

