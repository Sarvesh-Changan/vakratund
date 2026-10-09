import { describe, expect, it } from "vitest";

import { createSaveMediaAssetSchema } from "@/lib/validation/media";

const validImage = {
  publicId: "vakratund/projects/site-progress",
  url: "https://res.cloudinary.com/example/image/upload/v1/vakratund/projects/site-progress.jpg",
  kind: "IMAGE" as const,
  format: "jpg",
  bytes: 1024,
  width: 1200,
  height: 800,
  alt: "Construction work in progress on a project site",
  caption: "Project progress",
  folder: "vakratund/projects",
};

describe("media asset validation", () => {
  const schema = createSaveMediaAssetSchema("example");

  it("rejects a folder outside the allowlist", () => {
    const result = schema.safeParse({ ...validImage, folder: "vakratund/private" });
    expect(result.success).toBe(false);
  });

  it("rejects a format not allowed for the selected kind", () => {
    const result = schema.safeParse({ ...validImage, format: "svg" });
    expect(result.success).toBe(false);
  });

  it("rejects missing alt text for images", () => {
    const result = schema.safeParse({ ...validImage, alt: "   " });
    expect(result.success).toBe(false);
  });
});
