import { createHash } from "node:crypto";

import { getRequiredSecret } from "@/lib/env";
import { InMemoryRateLimiter } from "@/lib/rate-limit/limiter";

const UPLOAD_LIMIT = 30;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const limiter = new InMemoryRateLimiter();

function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown-ip";
}

export function checkUploadSignatureLimit(request: Request) {
  const salt = getRequiredSecret("BETTER_AUTH_SECRET");
  const ipHash = createHash("sha256").update(`${salt}:${requestIp(request)}`).digest("hex");
  return limiter.check(`upload-signature:${ipHash}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS);
}
