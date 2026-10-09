import { z } from "zod";

import { cloudinaryFolder, isAllowedFormat, mediaKindSchema, normalizeUploadFolder, UPLOAD_POLICIES } from "@/lib/cloudinary/policy";

const publicIdSchema = z.string().trim().min(1).max(255).regex(/^[A-Za-z0-9_./-]+$/, "Invalid Cloudinary public ID.");
const plainTextSchema = (max: number) => z.string().trim().max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed.");

export const signUploadRequestSchema = z.object({
  folder: z.string().trim().min(1),
  kind: mediaKindSchema,
}).strict();

export function createSaveMediaAssetSchema(cloudName: string) {
  return z.object({
    publicId: publicIdSchema,
    url: z.string().url(),
    kind: mediaKindSchema,
    format: z.string().trim().toLowerCase().min(1).max(10),
    bytes: z.number().int().positive(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt: plainTextSchema(300),
    caption: plainTextSchema(1000).optional(),
    folder: z.string().trim().min(1),
  }).strict().superRefine((value, context) => {
    const folder = normalizeUploadFolder(value.folder);
    if (!folder) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["folder"], message: "Folder is not allowed." });
    } else if (!value.publicId.startsWith(`${cloudinaryFolder(folder)}/`)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["publicId"], message: "Public ID must be inside the selected folder." });
    }

    if (!isAllowedFormat(value.kind, value.format)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["format"], message: "Format is not allowed for this media kind." });
    }
    if (value.publicId.split("/").some((segment) => segment === "..")) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["publicId"], message: "Public ID cannot contain path traversal." });
    }
    if (value.bytes > UPLOAD_POLICIES[value.kind].maxBytes) {
      context.addIssue({ code: z.ZodIssueCode.too_big, path: ["bytes"], maximum: UPLOAD_POLICIES[value.kind].maxBytes, inclusive: true, origin: "number", message: "File exceeds the size limit." });
    }
    if (value.kind === "IMAGE" && !value.alt) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["alt"], message: "Alt text is required for images." });
    }
    if (value.kind !== "DOCUMENT" && (!value.width || !value.height)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["width"], message: "Image and video dimensions are required." });
    }

    try {
      const url = new URL(value.url);
      if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || !url.pathname.startsWith(`/${cloudName}/`)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["url"], message: "URL must belong to the configured Cloudinary cloud." });
      }
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["url"], message: "URL must be a valid HTTPS URL." });
    }
  });
}

export const updateMediaAssetSchema = z.object({
  id: z.string().cuid(),
  alt: plainTextSchema(300),
  caption: plainTextSchema(1000).optional(),
}).strict();

export const deleteMediaAssetSchema = z.object({ id: z.string().cuid() }).strict();
