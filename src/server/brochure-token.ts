import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequiredSecret } from "@/lib/env";

export const BROCHURE_TOKEN_TTL_SECONDS = 10 * 60;

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", getRequiredSecret("BETTER_AUTH_SECRET"))
    .update(payload)
    .digest("base64url");
}

export function createBrochureToken(
  mediaId: string,
  now = Date.now(),
): string {
  const payload = base64Url(
    JSON.stringify({
      mediaId,
      expiresAt: Math.floor(now / 1000) + BROCHURE_TOKEN_TTL_SECONDS,
    }),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyBrochureToken(
  token: string,
  now = Date.now(),
): { mediaId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof (decoded as { mediaId?: unknown }).mediaId !== "string" ||
      typeof (decoded as { expiresAt?: unknown }).expiresAt !== "number" ||
      (decoded as { expiresAt: number }).expiresAt < Math.floor(now / 1000)
    ) {
      return null;
    }
    return { mediaId: (decoded as { mediaId: string }).mediaId };
  } catch {
    return null;
  }
}
