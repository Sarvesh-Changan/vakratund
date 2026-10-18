import "server-only";

import { getPublishedFaqs, type PublishedFaq } from "@/server/queries/faqs";
import { getPublishedGallery, type PublishedGalleryItem } from "@/server/queries/gallery";
import { getPublishedProjects, type PublishedProject } from "@/server/queries/projects";
import { getPublishedService, getPublishedServices, type PublishedService } from "@/server/queries/services";

export type PublishedServiceDetail = {
  service: PublishedService;
  relatedProjects: PublishedProject[];
  gallery: PublishedGalleryItem[];
  faqs: PublishedFaq[];
  previousService: PublishedService | null;
  nextService: PublishedService | null;
};

async function readPublishedServiceDetail(slug: string): Promise<PublishedServiceDetail | null> {
  const service = await getPublishedService(slug);
  if (!service) return null;

  const [relatedProjects, gallery, faqs, services] = await Promise.all([
    getPublishedProjects({ serviceSlug: service.slug }),
    getPublishedGallery(),
    getPublishedFaqs(service.slug),
    getPublishedServices(),
  ]);
  const index = services.findIndex((item) => item.slug === service.slug);
  return { service, relatedProjects, gallery, faqs, previousService: index > 0 ? services[index - 1] ?? null : null, nextService: index >= 0 ? services[index + 1] ?? null : null };
}

export function getPublishedServiceDetail(slug: string): Promise<PublishedServiceDetail | null> {
  // Each underlying public query is independently cached and tagged. Keeping this
  // composition outside another cache prevents nested cache scopes during SSG.
  return readPublishedServiceDetail(slug);
}
