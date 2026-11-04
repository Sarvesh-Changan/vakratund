import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const homeSlideFindMany = vi.hoisted(() => vi.fn());
const homeSlideAggregate = vi.hoisted(() => vi.fn());
const homeSlideCreate = vi.hoisted(() => vi.fn());
const mediaAssetCreate = vi.hoisted(() => vi.fn());
const disconnect = vi.hoisted(() => vi.fn());

vi.mock("../src/generated/prisma/client.js", () => {
  return {
    PrismaClient: class {
      homeSlide = {
        findMany: homeSlideFindMany,
        aggregate: homeSlideAggregate,
        create: homeSlideCreate,
      };
      mediaAsset = {
        create: mediaAssetCreate,
      };
      $disconnect = disconnect;
    },
  };
});

import { runHomeSliderSeed } from "./seed-home-slider";

type SeedEntry = {
  sourceName: string;
  sourceUrl: string;
  photographer: string;
  license: string;
  downloadUrl: string;
  alt: string;
  caption: string;
};

describe("seed-home-slider script & data validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("data/home-slider-seed.json", () => {
    it("contains exactly 10 compliant photo records from free-license sources", () => {
      const seedPath = resolve(process.cwd(), "data/home-slider-seed.json");
      const entries = JSON.parse(readFileSync(seedPath, "utf-8")) as SeedEntry[];

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(10);

      for (const entry of entries) {
        expect(entry.sourceName).toBe("Unsplash");
        expect(entry.sourceUrl).toMatch(/^https:\/\/unsplash\.com\/photos\//);
        expect(entry.downloadUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
        expect(entry.license).toBe("Unsplash License (free commercial use)");
        expect(entry.photographer.trim().length).toBeGreaterThan(0);
        expect(entry.alt.trim().length).toBeGreaterThan(10);
      }
    });
  });

  describe("runHomeSliderSeed logic", () => {
    it("is strictly idempotent and skips URLs already recorded in database", async () => {
      const seedPath = resolve(process.cwd(), "data/home-slider-seed.json");
      const entries = JSON.parse(readFileSync(seedPath, "utf-8")) as SeedEntry[];

      // All 10 URLs already present
      homeSlideFindMany.mockResolvedValue(
        entries.map((e: SeedEntry) => ({ sourceUrl: e.sourceUrl })),
      );
      homeSlideAggregate.mockResolvedValue({ _max: { sortOrder: 9 } });

      const fetchSpy = vi.spyOn(global, "fetch");

      await runHomeSliderSeed({ dryRun: true });

      // fetch should never be called when all are skipped
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("rejects non-image responses", async () => {
      homeSlideFindMany.mockResolvedValue([]);
      homeSlideAggregate.mockResolvedValue({ _max: { sortOrder: -1 } });

      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response("<html>Not an image</html>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );

      await expect(runHomeSliderSeed({ dryRun: true })).rejects.toThrow(
        /Only raster images are allowed/i,
      );
    });

    it("rejects images larger than 10 MB", async () => {
      homeSlideFindMany.mockResolvedValue([]);
      homeSlideAggregate.mockResolvedValue({ _max: { sortOrder: -1 } });

      const oversizedBuffer = new Uint8Array(10 * 1024 * 1024 + 1024);
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(oversizedBuffer, {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        }),
      );

      await expect(runHomeSliderSeed({ dryRun: true })).rejects.toThrow(
        /exceeds 10 MB limit/i,
      );
    });
  });
});
