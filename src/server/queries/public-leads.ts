import "server-only";

import { prisma } from "@/lib/db/client";

export type PublicLead = {
  publicId: string;
  type: "CONTACT" | "PROJECT_ENQUIRY" | "BROCHURE";
};

export async function getPublicLeadByReference(
  publicId: string,
  type: PublicLead["type"],
): Promise<PublicLead | null> {
  const lead = await prisma.lead.findFirst({
    where: { publicId, type, deletedAt: null },
    select: { publicId: true, type: true },
  });
  return lead
    ? { publicId: lead.publicId, type: lead.type as PublicLead["type"] }
    : null;
}
