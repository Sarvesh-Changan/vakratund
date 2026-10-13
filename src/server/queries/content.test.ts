import { describe, expect, it, vi } from "vitest";

const cacheCalls = vi.hoisted(() => vi.fn());
const testimonialFindMany = vi.hoisted(() => vi.fn());
const faqFindMany = vi.hoisted(() => vi.fn());
const teamFindMany = vi.hoisted(() => vi.fn());
const mediaFindMany = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => Promise<unknown>, key: string[], options: { tags: string[] }) => { cacheCalls({ key, options }); return fn; } }));
vi.mock("@/lib/db/client", () => ({ prisma: { testimonial: { findMany: testimonialFindMany }, faq: { findMany: faqFindMany }, teamMember: { findMany: teamFindMany }, mediaAsset: { findMany: mediaFindMany } } }));

import { getPublishedFaqs } from "@/server/queries/faqs";
import { getVisibleTeamMembers } from "@/server/queries/team";
import { getPublishedTestimonials } from "@/server/queries/testimonials";

describe("public content queries", () => {
  it("reads published testimonials with the testimonials cache tag", async () => {
    testimonialFindMany.mockResolvedValue([{ id: "t1", name: "Client", roleOrOrg: null, quote: "Good", rating: null, photo: null, project: null, sortOrder: 0 }]);
    const result = await getPublishedTestimonials();
    expect(result).toHaveLength(1);
    expect(testimonialFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED" } }));
    expect(cacheCalls).toHaveBeenCalledWith(expect.objectContaining({ options: { tags: ["testimonials"], revalidate: 3600 } }));
  });

  it("filters FAQs to published records and an optional service", async () => {
    faqFindMany.mockResolvedValue([]);
    await getPublishedFaqs("structural-repairs");
    expect(faqFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED", service: { is: { slug: "structural-repairs" } } } }));
    expect(cacheCalls).toHaveBeenCalledWith(expect.objectContaining({ options: { tags: ["faqs"], revalidate: 3600 } }));
  });

  it("returns only visible team members and image photos", async () => {
    teamFindMany.mockResolvedValue([{ id: "team-1", name: "Engineer", qualification: null, designation: "Engineer", experienceYrs: null, bio: null, photoId: "media-1", sortOrder: 0 }]);
    mediaFindMany.mockResolvedValue([{ id: "media-1", kind: "IMAGE", url: "https://example.test/team.jpg", alt: "Engineer", width: 100, height: 100 }]);
    const result = await getVisibleTeamMembers();
    expect(result[0]?.photo?.kind).toBe("IMAGE");
    expect(teamFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isVisible: true } }));
    expect(mediaFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ["media-1"] }, kind: "IMAGE" } }));
    expect(cacheCalls).toHaveBeenCalledWith(expect.objectContaining({ options: { tags: ["team"], revalidate: 3600 } }));
  });
});
