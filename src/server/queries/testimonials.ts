import "server-only";

import { unstable_cache } from "next/cache";

import type { MediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedTestimonialMedia = {
  id: string;
  mediaId: string;
  sortOrder: number;
  thumbnailId: string | null;
  media: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null };
  thumbnail: { id: string; url: string; alt: string } | null;
};

export type PublishedTestimonial = {
  id: string;
  name: string;
  roleOrOrg: string | null;
  quote: string;
  rating: number | null;
  photo: { id: string; url: string; alt: string; width: number | null; height: number | null } | null;
  media: PublishedTestimonialMedia[];
  project: { id: string; title: string; slug: string } | null;
  sortOrder: number;
};

const testimonialSelect = {
  id: true,
  name: true,
  roleOrOrg: true,
  quote: true,
  rating: true,
  photo: { select: { id: true, url: true, alt: true, width: true, height: true } },
  media: {
    select: {
      id: true,
      mediaId: true,
      sortOrder: true,
      thumbnailId: true,
      media: { select: { id: true, kind: true, url: true, alt: true, width: true, height: true } },
      thumbnail: { select: { id: true, url: true, alt: true } },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  project: { select: { id: true, title: true, slug: true } },
  sortOrder: true,
} satisfies Prisma.TestimonialSelect;

async function readPublishedTestimonials(): Promise<PublishedTestimonial[]> {
  return prisma.testimonial.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: testimonialSelect,
  });
}

export function getPublishedTestimonials(): Promise<PublishedTestimonial[]> {
  return unstable_cache(readPublishedTestimonials, ["published-testimonials"], { tags: ["testimonials"], revalidate: 3600 })();
}
