-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('PENDING', 'REVIEWED', 'CONTACTED');

-- DropIndex
DROP INDEX "Category_slug_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'zh';

-- AlterTable
ALTER TABLE "Competitor" ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'zh',
ADD COLUMN     "translationGroupId" TEXT,
ALTER COLUMN "source" SET DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "isCompetitor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStage" TEXT NOT NULL DEFAULT '0';

-- AlterTable
ALTER TABLE "SiteOntology" ADD COLUMN     "confirmedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstMeaningfulActionAt" TIMESTAMP(3),
ADD COLUMN     "lastCreditWarningAt" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'zh';

-- DropTable
DROP TABLE "SyncLog";

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatarId" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelConfig" (
    "id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteKeywordSnapshot" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "dimensionType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteKeywordSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachMove" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "evidence" JSONB NOT NULL,
    "payload" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "autoExecutable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CoachMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT NOT NULL,
    "targetMarket" TEXT,
    "goals" TEXT,
    "budget" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "wechat" TEXT,
    "details" JSONB,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'zh',

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Author_name_idx" ON "Author"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_key_key" ON "IntegrationConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ModelConfig_context_key" ON "ModelConfig"("context");

-- CreateIndex
CREATE INDEX "SiteKeywordSnapshot_siteId_dimensionType_snapshotDate_idx" ON "SiteKeywordSnapshot"("siteId", "dimensionType", "snapshotDate");

-- CreateIndex
CREATE INDEX "SiteKeywordSnapshot_siteId_value_dimensionType_idx" ON "SiteKeywordSnapshot"("siteId", "value", "dimensionType");

-- CreateIndex
CREATE INDEX "CoachMove_siteId_status_idx" ON "CoachMove"("siteId", "status");

-- CreateIndex
CREATE INDEX "ConsultationRequest_createdAt_idx" ON "ConsultationRequest"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ConsultationRequest_status_idx" ON "ConsultationRequest"("status");

-- CreateIndex
CREATE INDEX "Category_locale_isActive_order_idx" ON "Category"("locale", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Category_locale_slug_key" ON "Category"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_siteId_domain_key" ON "Competitor"("siteId", "domain");

-- CreateIndex
CREATE INDEX "Content_locale_status_visibility_publishedAt_idx" ON "Content"("locale", "status", "visibility", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Content_authorId_idx" ON "Content"("authorId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteKeywordSnapshot" ADD CONSTRAINT "SiteKeywordSnapshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMove" ADD CONSTRAINT "CoachMove_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

