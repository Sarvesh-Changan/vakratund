-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SALES');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('COMPLETED', 'ONGOING');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('QUOTE', 'CONTACT', 'PROJECT_ENQUIRY', 'BROCHURE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "ContactEventType" AS ENUM ('CALL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('ESTIMATE', 'INSPECTION_ONLY');

-- CreateEnum
CREATE TYPE "AreaUnit" AS ENUM ('SQFT', 'RFT', 'UNIT', 'LUMPSUM');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('SELECT', 'RADIO', 'NUMBER', 'BOOLEAN', 'MULTISELECT');

-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('NONE', 'SET_BASE_RATE', 'ADD_PER_UNIT', 'ADD_FLAT', 'MULTIPLY_PERCENT');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "diff" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "folder" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scopeItems" TEXT[],
    "iconKey" TEXT,
    "coverId" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "serviceId" TEXT,
    "clientName" TEXT,
    "showClientName" BOOLEAN NOT NULL DEFAULT false,
    "locationText" TEXT,
    "areaSqft" INTEGER,
    "floorsText" TEXT,
    "scopeText" TEXT,
    "year" INTEGER,
    "status" "ProjectStatus" NOT NULL DEFAULT 'COMPLETED',
    "progressPct" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMedia" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "isBefore" BOOLEAN NOT NULL DEFAULT false,
    "isAfter" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleOrOrg" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER,
    "projectId" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "serviceId" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qualification" TEXT,
    "designation" TEXT NOT NULL,
    "experienceYrs" INTEGER,
    "bio" TEXT,
    "photoId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverId" TEXT,
    "categoryId" TEXT,
    "authorId" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "readingMins" INTEGER,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSeo" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "ogImageId" TEXT,
    "canonical" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "businessName" TEXT NOT NULL,
    "tagline" TEXT,
    "phones" TEXT[],
    "email" TEXT,
    "whatsappNumber" TEXT,
    "whatsappMessage" TEXT,
    "address" TEXT,
    "mapEmbedUrl" TEXT,
    "businessHours" JSONB,
    "socials" JSONB,
    "credentials" JSONB,
    "brochureMediaId" TEXT,
    "notifyEmails" TEXT[],
    "foundedYear" INTEGER NOT NULL DEFAULT 2003,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" "LeadType" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "location" TEXT,
    "message" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "sourcePage" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "deviceType" TEXT,
    "ipHash" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "followUpAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStatusHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus" NOT NULL,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEvent" (
    "id" TEXT NOT NULL,
    "type" "ContactEventType" NOT NULL,
    "pagePath" TEXT NOT NULL,
    "context" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimatorService" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricingMode" "PricingMode" NOT NULL DEFAULT 'ESTIMATE',
    "unit" "AreaUnit" NOT NULL DEFAULT 'SQFT',
    "baseRate" DECIMAL(12,2) NOT NULL,
    "minCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minArea" INTEGER NOT NULL DEFAULT 100,
    "maxArea" INTEGER NOT NULL DEFAULT 100000,
    "spreadPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "roundTo" INTEGER NOT NULL DEFAULT 100,
    "disclaimer" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimatorService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimatorField" (
    "id" TEXT NOT NULL,
    "estimatorServiceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "min" INTEGER,
    "max" INTEGER,
    "step" INTEGER,
    "defaultValue" TEXT,
    "showIf" JSONB,
    "effectType" "EffectType" NOT NULL DEFAULT 'NONE',
    "effectValue" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimatorField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOption" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "effectType" "EffectType" NOT NULL DEFAULT 'NONE',
    "effectValue" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[],
    "multiplierPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "estimatorServiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB NOT NULL,
    "effectType" "EffectType" NOT NULL,
    "effectValue" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "estimatorServiceId" TEXT NOT NULL,
    "locationZoneId" TEXT,
    "areaValue" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "breakdown" JSONB NOT NULL,
    "configSnapshot" JSONB NOT NULL,
    "configVersion" INTEGER NOT NULL,
    "configHash" TEXT NOT NULL,
    "lowAmount" INTEGER NOT NULL,
    "highAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");

-- CreateIndex
CREATE INDEX "MediaAsset_folder_createdAt_idx" ON "MediaAsset"("folder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_status_sortOrder_idx" ON "Service"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Service_coverId_idx" ON "Service"("coverId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_publishStatus_isFeatured_sortOrder_idx" ON "Project"("publishStatus", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "Project_serviceId_idx" ON "Project"("serviceId");

-- CreateIndex
CREATE INDEX "Project_status_year_idx" ON "Project"("status", "year");

-- CreateIndex
CREATE INDEX "ProjectMedia_projectId_sortOrder_idx" ON "ProjectMedia"("projectId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProjectMedia_mediaId_idx" ON "ProjectMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMedia_projectId_mediaId_key" ON "ProjectMedia"("projectId", "mediaId");

-- CreateIndex
CREATE INDEX "GalleryItem_category_sortOrder_idx" ON "GalleryItem"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "GalleryItem_isVisible_category_sortOrder_idx" ON "GalleryItem"("isVisible", "category", "sortOrder");

-- CreateIndex
CREATE INDEX "GalleryItem_mediaId_idx" ON "GalleryItem"("mediaId");

-- CreateIndex
CREATE INDEX "Testimonial_status_sortOrder_idx" ON "Testimonial"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_projectId_idx" ON "Testimonial"("projectId");

-- CreateIndex
CREATE INDEX "Faq_serviceId_status_sortOrder_idx" ON "Faq"("serviceId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "TeamMember_isVisible_sortOrder_idx" ON "TeamMember"("isVisible", "sortOrder");

-- CreateIndex
CREATE INDEX "TeamMember_photoId_idx" ON "TeamMember"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_coverId_idx" ON "BlogPost"("coverId");

-- CreateIndex
CREATE INDEX "PageSection_pageKey_isVisible_sortOrder_idx" ON "PageSection"("pageKey", "isVisible", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PageSection_pageKey_sectionKey_key" ON "PageSection"("pageKey", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "PageSeo_path_key" ON "PageSeo"("path");

-- CreateIndex
CREATE INDEX "PageSeo_noIndex_idx" ON "PageSeo"("noIndex");

-- CreateIndex
CREATE INDEX "PageSeo_ogImageId_idx" ON "PageSeo"("ogImageId");

-- CreateIndex
CREATE INDEX "SiteSetting_brochureMediaId_idx" ON "SiteSetting"("brochureMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_publicId_key" ON "Lead"("publicId");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_type_createdAt_idx" ON "Lead"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_status_idx" ON "Lead"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_createdAt_idx" ON "LeadNote"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadNote_authorId_idx" ON "LeadNote"("authorId");

-- CreateIndex
CREATE INDEX "LeadStatusHistory_leadId_createdAt_idx" ON "LeadStatusHistory"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadStatusHistory_changedBy_idx" ON "LeadStatusHistory"("changedBy");

-- CreateIndex
CREATE INDEX "ContactEvent_type_createdAt_idx" ON "ContactEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ContactEvent_pagePath_createdAt_idx" ON "ContactEvent"("pagePath", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EstimatorService_serviceId_key" ON "EstimatorService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "EstimatorService_slug_key" ON "EstimatorService"("slug");

-- CreateIndex
CREATE INDEX "EstimatorService_isActive_sortOrder_idx" ON "EstimatorService"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "EstimatorField_estimatorServiceId_sortOrder_idx" ON "EstimatorField"("estimatorServiceId", "sortOrder");

-- CreateIndex
CREATE INDEX "EstimatorField_estimatorServiceId_isActive_idx" ON "EstimatorField"("estimatorServiceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EstimatorField_estimatorServiceId_key_key" ON "EstimatorField"("estimatorServiceId", "key");

-- CreateIndex
CREATE INDEX "FieldOption_fieldId_sortOrder_idx" ON "FieldOption"("fieldId", "sortOrder");

-- CreateIndex
CREATE INDEX "FieldOption_fieldId_isActive_idx" ON "FieldOption"("fieldId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FieldOption_fieldId_value_key" ON "FieldOption"("fieldId", "value");

-- CreateIndex
CREATE INDEX "LocationZone_isActive_sortOrder_idx" ON "LocationZone"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "PricingRule_estimatorServiceId_order_idx" ON "PricingRule"("estimatorServiceId", "order");

-- CreateIndex
CREATE INDEX "PricingRule_estimatorServiceId_isActive_idx" ON "PricingRule"("estimatorServiceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_leadId_key" ON "Quote"("leadId");

-- CreateIndex
CREATE INDEX "Quote_estimatorServiceId_createdAt_idx" ON "Quote"("estimatorServiceId", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_locationZoneId_idx" ON "Quote"("locationZoneId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimatorService" ADD CONSTRAINT "EstimatorService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimatorField" ADD CONSTRAINT "EstimatorField_estimatorServiceId_fkey" FOREIGN KEY ("estimatorServiceId") REFERENCES "EstimatorService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOption" ADD CONSTRAINT "FieldOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "EstimatorField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_estimatorServiceId_fkey" FOREIGN KEY ("estimatorServiceId") REFERENCES "EstimatorService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_estimatorServiceId_fkey" FOREIGN KEY ("estimatorServiceId") REFERENCES "EstimatorService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_locationZoneId_fkey" FOREIGN KEY ("locationZoneId") REFERENCES "LocationZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
