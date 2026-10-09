import "server-only";

import { randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { QuoteSubmissionInput } from "@/lib/validation/quote-submission";
import { buildConfigHash, buildConfigSnapshot } from "@/server/estimator/snapshot";
import type { Answers, EstimatorConfig, EstimateResult } from "@/server/estimator/types";

const PUBLIC_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type PersistQuoteInput = {
  submission: QuoteSubmissionInput;
  config: EstimatorConfig;
  result: EstimateResult;
  normalizedPhone: string;
  ipHash: string;
};

export type PersistQuoteResult = {
  leadId: string;
  publicId: string;
  isDuplicate: boolean;
};

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function createPublicId(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) suffix += PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length];
  return `VK-${suffix}`;
}

async function uniquePublicId(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicId = createPublicId();
    const existing = await tx.lead.findUnique({ where: { publicId }, select: { id: true } });
    if (!existing) return publicId;
  }
  throw new Error("Could not create a unique public reference.");
}

function locationZoneId(config: EstimatorConfig, answers: Answers): string | null {
  const value = answers.location;
  if (typeof value !== "string") return null;
  const needle = value.trim().toLowerCase();
  return config.locationZones.find((zone) => zone.id.toLowerCase() === needle || zone.name.toLowerCase() === needle || zone.keywords.some((keyword) => keyword.toLowerCase() === needle))?.id ?? null;
}

export async function persistQuoteSubmission(input: PersistQuoteInput): Promise<PersistQuoteResult> {
  const area = input.submission.answers[input.config.areaFieldKey];
  if (typeof area !== "number" || !Number.isInteger(area)) throw new Error("A valid integer area is required.");

  return prisma.$transaction(async (tx) => {
    const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const duplicate = await tx.lead.findFirst({ where: { phone: input.normalizedPhone, createdAt: { gte: duplicateSince }, deletedAt: null }, select: { id: true } });
    const publicId = await uniquePublicId(tx);
    const lead = await tx.lead.create({
      data: {
        publicId,
        type: input.config.pricingMode === "INSPECTION_ONLY" ? "INSPECTION" : "QUOTE",
        status: "NEW",
        name: input.submission.contact.name,
        phone: input.normalizedPhone,
        email: input.submission.contact.email || null,
        location: input.submission.contact.location,
        message: input.submission.contact.requirements,
        consent: input.submission.contact.consent,
        consentAt: new Date(),
        sourcePage: input.submission.tracking?.sourcePage || "/estimate",
        referrer: input.submission.tracking?.referrer || null,
        utmSource: input.submission.tracking?.utmSource || null,
        utmMedium: input.submission.tracking?.utmMedium || null,
        utmCampaign: input.submission.tracking?.utmCampaign || null,
        utmTerm: input.submission.tracking?.utmTerm || null,
        utmContent: input.submission.tracking?.utmContent || null,
        deviceType: input.submission.tracking?.deviceType || "unknown",
        ipHash: input.ipHash,
        isDuplicate: Boolean(duplicate),
        quote: {
          create: {
            estimatorServiceId: input.config.serviceId,
            locationZoneId: locationZoneId(input.config, input.submission.answers),
            areaValue: area,
            answers: jsonValue(input.submission.answers),
            breakdown: jsonValue(input.result.breakdown),
            configSnapshot: jsonValue(buildConfigSnapshot(input.config)),
            configVersion: input.config.version,
            configHash: buildConfigHash(input.config),
            lowAmount: Math.round(input.result.low ?? 0),
            highAmount: Math.round(input.result.high ?? 0),
          },
        },
      },
      select: { id: true, publicId: true, isDuplicate: true },
    });
    await tx.leadStatusHistory.create({ data: { leadId: lead.id, fromStatus: null, toStatus: "NEW", changedBy: null } });
    return { leadId: lead.id, publicId: lead.publicId, isDuplicate: lead.isDuplicate };
  });
}
