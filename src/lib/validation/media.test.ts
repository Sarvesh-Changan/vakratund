import { describe, expect, it } from "vitest";

import { createSaveMediaAssetSchema } from "@/lib/validation/media";

const validImage = {
  section: "projects",
  publicId: "vakratund/projects/site-progress",
  url: "https://res.cloudinary.com/example/image/upload/v1/vakratund/projects/site-progress.jpg",
  kind: "IMAGE" as const,
  format: "jpg",
  bytes: 1024,
  etag: "0123456789abcdef0123456789abcdef",
  width: 1200,
  height: 800,
  alt: "Construction work in progress on a project site",
  caption: "Project progress",
};

describe("media asset validation", () => {
  const schema = createSaveMediaAssetSchema("example");

  it("rejects a section outside the allowlist", () => {
    const result = schema.safeParse({ ...validImage, section: "private" });
    expect(result.success).toBe(false);
  });

  it("rejects a public ID outside the selected section", () => {
    const result = schema.safeParse({ ...validImage, publicId: "vakratund/team/photo" });
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

  it("rejects an oversized image", () => {
    const result = schema.safeParse({ ...validImage, bytes: 10 * 1024 * 1024 + 1 });
    expect(result.success).toBe(false);
  });

  it("rejects a media kind that the section does not allow", () => {
    const result = schema.safeParse({ ...validImage, kind: "DOCUMENT", format: "pdf", bytes: 100, width: undefined, height: undefined });
    expect(result.success).toBe(false);
  });
});
