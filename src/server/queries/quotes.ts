import "server-only";

import { prisma } from "@/lib/db/client";

export type PublicQuote = {
  publicId: string;
  serviceName: string;
  pricingMode: "ESTIMATE" | "INSPECTION_ONLY";
  lowAmount: number;
  highAmount: number;
  breakdown: Array<{ id: string; label: string; amount: number; kind: string }>;
  createdAt: string;
};

function publicBreakdown(value: unknown): PublicQuote["breakdown"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    return typeof record.id === "string" && typeof record.label === "string" && typeof record.amount === "number" && typeof record.kind === "string" ? [{ id: record.id, label: record.label, amount: record.amount, kind: record.kind }] : [];
  });
}

export async function getPublicQuoteByReference(publicId: string): Promise<PublicQuote | null> {
  const row = await prisma.quote.findFirst({ where: { lead: { publicId, deletedAt: null } }, select: { lowAmount: true, highAmount: true, breakdown: true, createdAt: true, lead: { select: { publicId: true } }, estimatorService: { select: { name: true, pricingMode: true } } } });
  if (!row) return null;
  return { publicId: row.lead.publicId, serviceName: row.estimatorService.name, pricingMode: String(row.estimatorService.pricingMode) as PublicQuote["pricingMode"], lowAmount: row.lowAmount, highAmount: row.highAmount, breakdown: publicBreakdown(row.breakdown), createdAt: row.createdAt.toISOString() };
}
