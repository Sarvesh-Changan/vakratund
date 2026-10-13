import "server-only";

import { createHash } from "node:crypto";

import { env } from "@/lib/env";
import { cloudinaryFolder, cloudinaryResourceType, type UploadKind, type UploadSection, uploadPolicy } from "@/lib/cloudinary/policy";

export type CloudinaryUploadSignature = {
  apiKey: string;
  cloudName: string;
  resourceType: string;
  folder: string;
  timestamp: number;
  expiresAt: number;
  allowedFormats: string;
  transformation?: string;
  signature: string;
  signedParameterNames: readonly string[];
};

function requireCloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string } {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured.");
  const publicCloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (publicCloudName && publicCloudName !== cloudName) throw new Error("Cloudinary cloud names are inconsistent.");
  return { cloudName, apiKey, apiSecret };
}

export function serializeCloudinarySignatureParameters(parameters: Record<string, string | number>): string {
  return Object.entries(parameters)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function signParameters(parameters: Record<string, string | number>, apiSecret: string): string {
  const serialized = serializeCloudinarySignatureParameters(parameters);
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export function signUploadParameters(section: UploadSection, kind: UploadKind, now = Date.now()): CloudinaryUploadSignature {
  const config = requireCloudinaryConfig();
  const policy = uploadPolicy(section, kind);
  if (!policy) throw new Error("This media kind is not allowed in the selected section.");
  const timestamp = Math.floor(now / 1000);
  const expiresAt = timestamp + 5 * 60;
  const parameters = {
    allowed_formats: policy.formats.join(","),
    folder: cloudinaryFolder(section),
    timestamp,
    ...(kind === "IMAGE" ? { transformation: "fl_strip_profile" } : {}),
  };
  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    resourceType: cloudinaryResourceType(kind),
    folder: parameters.folder,
    timestamp,
    expiresAt,
    allowedFormats: parameters.allowed_formats,
    ...(parameters.transformation ? { transformation: parameters.transformation } : {}),
    signature: signParameters(parameters, config.apiSecret),
    signedParameterNames: Object.keys(parameters).sort(),
  };
}

export async function destroyCloudinaryAsset(publicId: string, kind: UploadKind): Promise<void> {
  const config = requireCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = kind === "IMAGE" ? "image" : kind === "VIDEO" ? "video" : "raw";
  const signature = signParameters({ public_id: publicId, timestamp }, config.apiSecret);
  const body = new URLSearchParams({
    api_key: config.apiKey,
    public_id: publicId,
    signature,
    timestamp: String(timestamp),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("Cloudinary asset deletion failed.");
}
