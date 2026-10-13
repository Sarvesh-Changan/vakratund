import "server-only";

import { z } from "zod";

import { env } from "@/lib/env";

const cloudinaryResourceSchema = z.object({
  public_id: z.string(),
  bytes: z.number().int().nonnegative().optional(),
  etag: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
}).passthrough();

export type CloudinaryResourceMetadata = {
  publicId: string;
  bytes?: number;
  etag?: string;
  width?: number;
  height?: number;
  duration?: number;
};

/** Fetches one resource from Cloudinary's authenticated Admin API. */
export async function getCloudinaryResourceMetadata(publicId: string, mediaType: "IMAGE" | "VIDEO"): Promise<CloudinaryResourceMetadata> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary Admin API is not configured.");

  const encodedId = publicId.split("/").map(encodeURIComponent).join("/");
  const resourceType = mediaType === "VIDEO" ? "video" : "image";
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/${resourceType}/upload/${encodedId}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Cloudinary Admin API returned ${response.status}.`);
  const parsed = cloudinaryResourceSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.public_id !== publicId) throw new Error("Cloudinary Admin API returned invalid resource metadata.");
  const resource = parsed.data;
  return {
    publicId: resource.public_id,
    ...(resource.bytes !== undefined ? { bytes: resource.bytes } : {}),
    ...(resource.etag ? { etag: resource.etag } : {}),
    ...(resource.width !== undefined ? { width: resource.width } : {}),
    ...(resource.height !== undefined ? { height: resource.height } : {}),
    ...(resource.duration !== undefined ? { duration: resource.duration } : {}),
  };
}
