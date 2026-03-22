/*
  Warnings:

  - A unique constraint covering the columns `[siteId,keyword]` on the table `SiteKeyword` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Ga4Connection_siteId_idx";

-- DropIndex
DROP INDEX "GscConnection_siteId_idx";

-- DropIndex
DROP INDEX "PlannedArticle_contentPlanId_idx";

-- DropIndex
DROP INDEX "PlannedArticle_status_idx";

-- DropIndex
DROP INDEX "SiteAudit_siteId_idx";

-- DropIndex
DROP INDEX "SiteKeyword_keyword_idx";

-- DropIndex
DROP INDEX "SiteKeyword_siteId_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "workspaceId" TEXT;

-- CreateIndex
CREATE INDEX "CreditTransaction_externalId_idx" ON "CreditTransaction"("externalId");

-- CreateIndex
CREATE INDEX "Ga4Connection_siteId_propertyId_idx" ON "Ga4Connection"("siteId", "propertyId");

-- CreateIndex
CREATE INDEX "GscConnection_siteId_propertyId_idx" ON "GscConnection"("siteId", "propertyId");

-- CreateIndex
CREATE INDEX "PlannedArticle_contentPlanId_status_idx" ON "PlannedArticle"("contentPlanId", "status");

-- CreateIndex
CREATE INDEX "SiteAudit_siteId_createdAt_idx" ON "SiteAudit"("siteId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SiteKeyword_siteId_keyword_key" ON "SiteKeyword"("siteId", "keyword");
