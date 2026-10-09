CREATE TYPE "EmailLogStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "EmailLogStatus" NOT NULL,
    "leadId" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailLog_leadId_createdAt_idx" ON "EmailLog"("leadId", "createdAt");
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");

ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
