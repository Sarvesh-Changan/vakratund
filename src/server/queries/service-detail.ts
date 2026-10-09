import "server-only";

import { getPublishedFaqs, type PublishedFaq } from "@/server/queries/faqs";
import { getPublishedGallery, type PublishedGalleryItem } from "@/server/queries/gallery";
import { getPublishedProjects, type PublishedProject } from "@/server/queries/projects";
import { getPublishedService, type PublishedService } from "@/server/queries/services";

export type PublishedServiceDetail = {
  service: PublishedService;
  relatedProjects: PublishedProject[];
  gallery: PublishedGalleryItem[];
  faqs: PublishedFaq[];
};

async function readPublishedServiceDetail(slug: string): Promise<PublishedServiceDetail | null> {
  const service = await getPublishedService(slug);
  if (!service) return null;

  const [relatedProjects, gallery, faqs] = await Promise.all([
    getPublishedProjects({ serviceSlug: service.slug }),
    getPublishedGallery(service.slug),
    getPublishedFaqs(service.slug),
  ]);

  return { service, relatedProjects, gallery, faqs };
}

export function getPublishedServiceDetail(slug: string): Promise<PublishedServiceDetail | null> {
  // Each underlying public query is independently cached and tagged. Keeping this
  // composition outside another cache prevents nested cache scopes during SSG.
  return readPublishedServiceDetail(slug);
}
