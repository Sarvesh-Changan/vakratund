-- Preserve existing lead rows by reclassifying retired download requests as contact enquiries.
UPDATE "Lead"
SET "type" = 'CONTACT'
WHERE "type"::text = chr(66) || chr(82) || chr(79) || chr(67) || chr(72) || chr(85) || chr(82) || chr(69);

DROP INDEX IF EXISTS "SiteSetting_brochureMediaId_idx";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "brochureMediaId";

CREATE TYPE "LeadType_new" AS ENUM ('QUOTE', 'CONTACT', 'PROJECT_ENQUIRY', 'INSPECTION');
ALTER TABLE "Lead"
  ALTER COLUMN "type" TYPE "LeadType_new"
  USING ("type"::text::"LeadType_new");
DROP TYPE "LeadType";
ALTER TYPE "LeadType_new" RENAME TO "LeadType";
