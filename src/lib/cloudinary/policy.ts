import { z } from "zod";

export const UPLOAD_FOLDERS = ["projects", "gallery", "blog", "team", "docs"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const mediaKindSchema = z.enum(["IMAGE", "VIDEO", "DOCUMENT"]);
export type UploadKind = z.infer<typeof mediaKindSchema>;

export const UPLOAD_POLICIES = {
  IMAGE: { formats: ["jpg", "jpeg", "png", "webp", "avif"], maxBytes: 10 * 1024 * 1024 },
  VIDEO: { formats: ["mp4", "webm"], maxBytes: 50 * 1024 * 1024 },
  DOCUMENT: { formats: ["pdf"], maxBytes: 15 * 1024 * 1024 },
} as const satisfies Record<UploadKind, { formats: readonly string[]; maxBytes: number }>;

export function normalizeUploadFolder(value: string): UploadFolder | null {
  const candidate = value.trim().replace(/^\/+/, "").replace(/^vakratund\//, "");
  return (UPLOAD_FOLDERS as readonly string[]).includes(candidate) ? (candidate as UploadFolder) : null;
}

export function cloudinaryFolder(folder: UploadFolder): `vakratund/${UploadFolder}` {
  return `vakratund/${folder}`;
}

export function isAllowedFormat(kind: UploadKind, format: string): boolean {
  return (UPLOAD_POLICIES[kind].formats as readonly string[]).includes(format.trim().toLowerCase());
}
