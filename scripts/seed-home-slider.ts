import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { loadStandaloneEnv } from "../src/lib/standalone-env.js";

type SeedEntry = {
  sourceName: string;
  sourceUrl: string;
  photographer: string;
  license: string;
  downloadUrl: string;
  alt: string;
  caption: string;
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const FOLDER = "vakratund/home";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) must be set to run the home slider seed.",
    );
  }
  return { cloudName, apiKey, apiSecret };
}

function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return createHash("sha1").update(`${sorted}${apiSecret}`).digest("hex");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runHomeSliderSeed(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun ?? process.argv.includes("--dry-run");

  console.info(`Starting Home Slider Seed (mode: ${isDryRun ? "DRY-RUN" : "LIVE"})...`);

  const seedFilePath = resolve(process.cwd(), "data/home-slider-seed.json");
  const rawData = readFileSync(seedFilePath, "utf-8");
  const entries: SeedEntry[] = JSON.parse(rawData);

  if (!Array.isArray(entries) || entries.length !== 10) {
    throw new Error(`Expected exactly 10 entries in ${seedFilePath}, found ${entries?.length}`);
  }

  const env = process.env.DATABASE_URL ? process.env : loadStandaloneEnv().environment;
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the home slider seed.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    // 1. Check existing slides to ensure idempotency
    const existingSlides = await prisma.homeSlide.findMany({
      select: { sourceUrl: true },
    });
    const importedUrls = new Set(existingSlides.map((s) => s.sourceUrl).filter(Boolean));

    console.info(`Found ${importedUrls.size} existing slides already recorded in database.`);

    const maxSort = await prisma.homeSlide.aggregate({ _max: { sortOrder: true } });
    let nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1;

    let processedCount = 0;
    let skippedCount = 0;

    for (const [index, entry] of entries.entries()) {
      if (importedUrls.has(entry.sourceUrl)) {
        console.info(`[${index + 1}/10] Skipping already imported photo: ${entry.sourceUrl}`);
        skippedCount++;
        continue;
      }

      console.info(`[${index + 1}/10] Downloading "${entry.alt}" from ${entry.sourceUrl}...`);

      const response = await fetch(entry.downloadUrl, {
        headers: {
          "User-Agent": "Vakratund-Construction-Seed/1.0 (contact: info@vakratundconstruction.com)",
          Accept: "image/jpeg,image/png,image/webp,image/avif,*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download image from ${entry.downloadUrl}: HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      const isAllowedType = ALLOWED_CONTENT_TYPES.some((type) => contentType.includes(type));
      if (!isAllowedType) {
        throw new Error(`Invalid content type "${contentType}" from ${entry.downloadUrl}. Only raster images are allowed.`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > MAX_BYTES) {
        throw new Error(`Image size ${buffer.length} bytes exceeds 10 MB limit (${entry.downloadUrl})`);
      }

      console.info(`  Downloaded ${buffer.length} bytes (${contentType}).`);

      if (isDryRun) {
        console.info(`  [DRY-RUN] Would upload to Cloudinary folder "${FOLDER}" and create HomeSlide.`);
        processedCount++;
        continue;
      }

      // Live upload to Cloudinary
      const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = signParams({ folder: FOLDER, timestamp }, apiSecret);

      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: contentType }), "seed-slide.jpg");
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", FOLDER);
      formData.append("signature", signature);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Cloudinary upload failed (HTTP ${uploadRes.status}): ${errorText}`);
      }

      const uploadData = await uploadRes.json() as {
        public_id: string;
        secure_url: string;
        format: string;
        bytes: number;
        etag?: string;
        width?: number;
        height?: number;
      };

      console.info(`  Uploaded to Cloudinary: ${uploadData.public_id}`);

      // Create MediaAsset and HomeSlide
      const media = await prisma.mediaAsset.create({
        data: {
          publicId: uploadData.public_id,
          url: uploadData.secure_url,
          kind: "IMAGE",
          format: uploadData.format,
          bytes: uploadData.bytes,
          etag: uploadData.etag ?? `seed-${Date.now()}`,
          width: uploadData.width ?? null,
          height: uploadData.height ?? null,
          alt: entry.alt,
          folder: FOLDER,
        },
      });

      await prisma.homeSlide.create({
        data: {
          mediaId: media.id,
          alt: entry.alt,
          caption: entry.caption || null,
          isActive: true,
          sortOrder: nextSortOrder++,
          isPlaceholder: true,
          sourceName: entry.sourceName,
          sourceUrl: entry.sourceUrl,
          license: entry.license,
        },
      });

      processedCount++;
      console.info(`  Created MediaAsset (${media.id}) and HomeSlide.`);

      // Polite delay between downloads
      await sleep(500);
    }

    console.info(`\nSeed completed: ${processedCount} processed, ${skippedCount} skipped.`);
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].includes("seed-home-slider")) {
  runHomeSliderSeed().catch((err) => {
    console.error("Home slider seed failed:", err);
    process.exit(1);
  });
}

