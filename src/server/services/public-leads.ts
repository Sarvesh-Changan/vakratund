import "server-only";

import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { TrackingInput } from "@/lib/validation/leads";

const PUBLIC_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicLeadType = "CONTACT" | "PROJECT_ENQUIRY";

export type PersistPublicLeadInput = {
  type: PublicLeadType;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  message?: string;
  consent: boolean;
  tracking?: TrackingInput;
  ipHash: string;
  projectSlug?: string;
};

export type PersistPublicLeadResult = {
  leadId: string;
  publicId: string;
  isDuplicate: boolean;
};

export class ProjectNotFoundError extends Error {
  constructor() {
    super("PROJECT_NOT_FOUND");
    this.name = "ProjectNotFoundError";
  }
}

function createPublicId(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) {
    suffix += PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length];
  }
  return `VK-${suffix}`;
}

async function uniquePublicId(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicId = createPublicId();
    const existing = await tx.lead.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!existing) return publicId;
  }
  throw new Error("Could not create a unique public reference.");
}

export async function persistPublicLead(
  input: PersistPublicLeadInput,
): Promise<PersistPublicLeadResult> {
  return prisma.$transaction(async (tx) => {
    let projectSlug: string | undefined;
    if (input.type === "PROJECT_ENQUIRY") {
      const project = await tx.project.findFirst({
        where: { slug: input.projectSlug, publishStatus: "PUBLISHED" },
        select: { slug: true },
      });
      if (!project) throw new ProjectNotFoundError();
      projectSlug = project.slug;
    }

    const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const duplicate = await tx.lead.findFirst({
      where: {
        phone: input.phone,
        createdAt: { gte: duplicateSince },
        deletedAt: null,
      },
      select: { id: true },
    });
    const publicId = await uniquePublicId(tx);
    const message = projectSlug
      ? `Project slug: ${projectSlug}\n${input.message ?? ""}`.trim().slice(0, 2_000)
      : input.message ?? null;

    const lead = await tx.lead.create({
      data: {
        publicId,
        type: input.type,
        status: "NEW",
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        location: input.location || null,
        message,
        consent: input.consent,
        consentAt: new Date(),
        sourcePage:
          input.tracking?.sourcePage ??
          (projectSlug ? `/projects/${projectSlug}` : "/contact"),
        referrer: input.tracking?.referrer ?? null,
        utmSource: input.tracking?.utmSource ?? null,
        utmMedium: input.tracking?.utmMedium ?? null,
        utmCampaign: input.tracking?.utmCampaign ?? null,
        utmTerm: input.tracking?.utmTerm ?? null,
        utmContent: input.tracking?.utmContent ?? null,
        deviceType: input.tracking?.deviceType ?? "unknown",
        ipHash: input.ipHash,
        isDuplicate: Boolean(duplicate),
      },
      select: { id: true, publicId: true, isDuplicate: true },
    });
    await tx.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        fromStatus: null,
        toStatus: "NEW",
        changedBy: null,
      },
    });

    return {
      leadId: lead.id,
      publicId: lead.publicId,
      isDuplicate: lead.isDuplicate,
    };
  });
}
