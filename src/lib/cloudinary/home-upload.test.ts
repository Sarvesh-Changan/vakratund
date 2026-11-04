import { describe, expect, it } from "vitest";

import {
  cloudinaryFolder,
  isAllowedFormat,
  normalizeUploadSection,
  sectionAllowsKind,
  SECTION_POLICIES,
  UPLOAD_POLICIES,
  UPLOAD_SECTIONS,
  uploadPolicy,
} from "@/lib/cloudinary/policy";

describe("home upload section policy", () => {
  it("includes home in UPLOAD_SECTIONS with folder vakratund/home", () => {
    expect(UPLOAD_SECTIONS).toContain("home");
    expect(cloudinaryFolder("home")).toBe("vakratund/home");
    expect(SECTION_POLICIES.home.folder).toBe("vakratund/home");
    expect(SECTION_POLICIES.home.kinds).toEqual(["IMAGE"]);
  });

  it("allows only IMAGE kind and rejects VIDEO and DOCUMENT", () => {
    expect(sectionAllowsKind("home", "IMAGE")).toBe(true);
    expect(sectionAllowsKind("home", "VIDEO")).toBe(false);
    expect(sectionAllowsKind("home", "DOCUMENT")).toBe(false);
  });

  it("enforces 10 MB limit for home images", () => {
    const policy = uploadPolicy("home", "IMAGE");
    expect(policy).not.toBeNull();
    expect(policy?.maxBytes).toBe(UPLOAD_POLICIES.IMAGE.maxBytes);
    expect(UPLOAD_POLICIES.IMAGE.maxBytes).toBe(10 * 1024 * 1024);
  });

  it("allows standard raster images (jpg, jpeg, png, webp, avif)", () => {
    const validFormats = ["jpg", "jpeg", "png", "webp", "avif"];
    for (const format of validFormats) {
      expect(isAllowedFormat("home", "IMAGE", format)).toBe(true);
    }
  });

  it("strictly rejects SVG, executables, and non-raster formats", () => {
    const invalidFormats = ["svg", "pdf", "gif", "mp4", "exe", "html"];
    for (const format of invalidFormats) {
      expect(isAllowedFormat("home", "IMAGE", format)).toBe(false);
    }
  });

  it("normalizes upload section candidates correctly", () => {
    expect(normalizeUploadSection("home")).toBe("home");
    expect(normalizeUploadSection("vakratund/home")).toBe("home");
    expect(normalizeUploadSection("/vakratund/home/")).toBe("home");
    expect(normalizeUploadSection("unknown")).toBeNull();
  });
});
