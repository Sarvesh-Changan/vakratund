import "server-only";

import { unstable_cache } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedFaq = {
  id: string;
  question: string;
  answer: string;
  service: { id: string; title: string; slug: string } | null;
  sortOrder: number;
};

const faqSelect = {
  id: true,
  question: true,
  answer: true,
  service: { select: { id: true, title: true, slug: true } },
  sortOrder: true,
} satisfies Prisma.FaqSelect;

async function readPublishedFaqs(serviceSlug?: string): Promise<PublishedFaq[]> {
  return prisma.faq.findMany({
    where: { status: "PUBLISHED", ...(serviceSlug ? { service: { is: { slug: serviceSlug } } } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: faqSelect,
  });
}

export function getPublishedFaqs(serviceSlug?: string): Promise<PublishedFaq[]> {
  return unstable_cache(() => readPublishedFaqs(serviceSlug), ["published-faqs", serviceSlug ?? "all"], { tags: ["faqs"], revalidate: 3600 })();
}
