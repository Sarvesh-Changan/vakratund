import { beforeEach, describe, expect, it, vi } from "vitest";

const homeSlideFindMany = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@/lib/db/client", () => ({
  prisma: {
    homeSlide: {
      findMany: homeSlideFindMany,
    },
  },
}));

import { getActiveHomeSlides } from "@/server/queries/home-slides";

describe("getActiveHomeSlides public query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only active slides ordered by sortOrder ascending", async () => {
    const mockSlides = [
      { id: "s-1", sortOrder: 0, isActive: true, media: { publicId: "vakratund/home/img1" } },
      { id: "s-2", sortOrder: 1, isActive: true, media: { publicId: "vakratund/home/img2" } },
    ];
    homeSlideFindMany.mockResolvedValue(mockSlides);

    const slides = await getActiveHomeSlides();
    expect(slides).toEqual(mockSlides);
    expect(homeSlideFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        media: {
          select: {
            publicId: true,
            altText: true,
            width: true,
            height: true,
          },
        },
      },
    });
  });
});
