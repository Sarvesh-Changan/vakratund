ALTER TABLE "Service"
ADD COLUMN "group" TEXT,
ADD COLUMN "processSteps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "typicalProjects" TEXT,
ADD COLUMN "audience" TEXT;
