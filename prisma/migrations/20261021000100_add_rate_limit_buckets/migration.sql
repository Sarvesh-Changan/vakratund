-- Persistent application login lockout buckets. keyHash and emailHash are HMACs;
-- no raw IP address or email address is stored here.
CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "emailHash" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitBucket_keyHash_key" ON "RateLimitBucket"("keyHash");
CREATE INDEX "RateLimitBucket_keyHash_idx" ON "RateLimitBucket"("keyHash");
CREATE INDEX "RateLimitBucket_emailHash_idx" ON "RateLimitBucket"("emailHash");
CREATE INDEX "RateLimitBucket_updatedAt_idx" ON "RateLimitBucket"("updatedAt");
