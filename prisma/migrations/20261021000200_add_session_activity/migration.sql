-- Server-enforced admin idle timeout activity marker.
ALTER TABLE "Session"
ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Session_userId_lastActivityAt_idx"
ON "Session"("userId", "lastActivityAt");
