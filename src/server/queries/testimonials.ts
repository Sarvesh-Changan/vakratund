import "server-only";

import { unstable_cache } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedTestimonial = {
  id: string;
  name: string;
  roleOrOrg: string | null;
  quote: string;
  rating: number | null;
  project: { id: string; title: string; slug: string } | null;
  sortOrder: number;
};

const testimonialSelect = {
  id: true,
  name: true,
  roleOrOrg: true,
  quote: true,
  rating: true,
  project: { select: { id: true, title: true, slug: true } },
  sortOrder: true,
} satisfies Prisma.TestimonialSelect;

async function readPublishedTestimonials(): Promise<PublishedTestimonial[]> {
  return prisma.testimonial.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: testimonialSelect });
}

export function getPublishedTestimonials(): Promise<PublishedTestimonial[]> {
  return unstable_cache(readPublishedTestimonials, ["published-testimonials"], { tags: ["testimonials"], revalidate: 3600 })();
}
