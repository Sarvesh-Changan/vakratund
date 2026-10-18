import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { businessHoursSchema, isAllowedMapEmbedUrl, type BusinessHours } from "@/lib/validation/settings";

const socialLinkSchema = z.object({ label: z.string().trim().min(1).max(40), url: z.string().url().max(500) }).strict();
const credentialSchema = z.object({ label: z.string().trim().min(1).max(100), value: z.string().trim().min(1).max(300) }).strict();

export type PublicSocialLink = z.infer<typeof socialLinkSchema>;
export type PublicCredential = z.infer<typeof credentialSchema>;
export type PublicSiteSettings = {
  businessName: string;
  tagline: string | null;
  phones: string[];
  email: string | null;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  responseTimeText: string | null;
  address: string | null;
  mapEmbedUrl: string | null;
  businessHours: BusinessHours | null;
  socials: PublicSocialLink[];
  credentials: PublicCredential[];
  foundedYear: number;
};

const publicSettingsSelect = {
  businessName: true,
  tagline: true,
  phones: true,
  email: true,
  whatsappNumber: true,
  whatsappMessage: true,
  responseTimeText: true,
  address: true,
  mapEmbedUrl: true,
  businessHours: true,
  socials: true,
  credentials: true,
  foundedYear: true,
} as const;

async function readPublicSettings(): Promise<PublicSiteSettings | null> {
  const row = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: publicSettingsSelect });
  if (!row) return null;

  return {
    ...row,
    mapEmbedUrl: row.mapEmbedUrl && isAllowedMapEmbedUrl(row.mapEmbedUrl) ? row.mapEmbedUrl : null,
    businessHours: businessHoursSchema.safeParse(row.businessHours).data ?? null,
    socials: socialLinkSchema.array().safeParse(row.socials).data ?? [],
    credentials: credentialSchema.array().safeParse(row.credentials).data ?? [],
  };
}

export const getPublicSettings = unstable_cache(readPublicSettings, ["site-settings"], { tags: ["settings"], revalidate: 3600 });
