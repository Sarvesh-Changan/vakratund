import { z } from "zod";

export const UPLOAD_SECTIONS = ["projects", "testimonials", "team", "gallery", "docs"] as const;
export type UploadSection = (typeof UPLOAD_SECTIONS)[number];

export const mediaKindSchema = z.enum(["IMAGE", "VIDEO", "DOCUMENT"]);
export type UploadKind = z.infer<typeof mediaKindSchema>;
export type CloudinaryResourceType = "image" | "video" | "raw";

export const UPLOAD_POLICIES = {
  IMAGE: { formats: ["jpg", "jpeg", "png", "webp", "avif"], maxBytes: 10 * 1024 * 1024 },
  VIDEO: { formats: ["mp4", "webm"], maxBytes: 50 * 1024 * 1024 },
  DOCUMENT: { formats: ["pdf"], maxBytes: 15 * 1024 * 1024 },
} as const satisfies Record<UploadKind, { formats: readonly string[]; maxBytes: number }>;

type SectionPolicy = {
  folder: `vakratund/${UploadSection}`;
  kinds: readonly UploadKind[];
};

export const SECTION_POLICIES = {
  projects: { folder: "vakratund/projects", kinds: ["IMAGE", "VIDEO"] },
  testimonials: { folder: "vakratund/testimonials", kinds: ["IMAGE"] },
  team: { folder: "vakratund/team", kinds: ["IMAGE"] },
  gallery: { folder: "vakratund/gallery", kinds: ["IMAGE", "VIDEO"] },
  docs: { folder: "vakratund/docs", kinds: ["DOCUMENT"] },
} as const satisfies Record<UploadSection, SectionPolicy>;

export function normalizeUploadSection(value: string): UploadSection | null {
  const candidate = value.trim().replace(/^\/+/, "").replace(/^vakratund\//, "");
  return (UPLOAD_SECTIONS as readonly string[]).includes(candidate) ? (candidate as UploadSection) : null;
}

export function cloudinaryFolder(section: UploadSection): `vakratund/${UploadSection}` {
  return SECTION_POLICIES[section].folder;
}

export function sectionAllowsKind(section: UploadSection, kind: UploadKind): boolean {
  return (SECTION_POLICIES[section].kinds as readonly UploadKind[]).includes(kind);
}

export function uploadPolicy(section: UploadSection, kind: UploadKind) {
  if (!sectionAllowsKind(section, kind)) return null;
  return UPLOAD_POLICIES[kind];
}

export function cloudinaryResourceType(kind: UploadKind): CloudinaryResourceType {
  return kind === "IMAGE" ? "image" : kind === "VIDEO" ? "video" : "raw";
}

export function isAllowedFormat(section: UploadSection, kind: UploadKind, format: string): boolean {
  const policy = uploadPolicy(section, kind);
  return Boolean(policy?.formats && (policy.formats as readonly string[]).includes(format.trim().toLowerCase()));
}
