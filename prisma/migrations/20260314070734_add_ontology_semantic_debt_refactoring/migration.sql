/*
  Warnings:

  - A unique constraint covering the columns `[providerId,accountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identifier]` on the table `Verification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identifier,value]` on the table `Verification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StrategyStatus" AS ENUM ('IDEATION', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'REFACTORING_NEEDED');

-- CreateEnum
CREATE TYPE "TargetChannel" AS ENUM ('SEO', 'GOOGLE_ADS', 'META_ADS');

-- AlterTable
ALTER TABLE "TrackedArticle" ADD COLUMN     "contentHtml" TEXT,
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT,
    "targetMarkets" TEXT[],
    "seedKeywords" TEXT[],
    "businessOntology" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteOntology" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "coreOfferings" TEXT[],
    "targetAudience" TEXT[],
    "painPointsSolved" TEXT[],
    "logicChains" JSONB,
    "idealTopicMap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteOntology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticDebt" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "ontologyId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopics" TEXT[],
    "relevance" TEXT NOT NULL,
    "coverageScore" INTEGER,
    "proofDensity" INTEGER,
    "gscImpressions" INTEGER,
    "gscClicks" INTEGER,
    "priorityLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SemanticDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteAudit" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "techScore" INTEGER,
    "contentScore" INTEGER,
    "geoScore" INTEGER,
    "report" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteKeyword" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "volume" INTEGER,
    "difficulty" INTEGER,
    "position" INTEGER,
    "clicks" INTEGER,
    "impressions" INTEGER,
    "language" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "topics" TEXT[],

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPlan" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "StrategyStatus" NOT NULL DEFAULT 'IDEATION',
    "theme" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedArticle" (
    "id" TEXT NOT NULL,
    "contentPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "volume" INTEGER,
    "difficulty" INTEGER,
    "language" TEXT NOT NULL,
    "pillar" BOOLEAN NOT NULL DEFAULT false,
    "clusterOf" TEXT,
    "kanbanOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "StrategyStatus" NOT NULL DEFAULT 'IDEATION',
    "targetChannel" "TargetChannel" NOT NULL DEFAULT 'SEO',
    "articleId" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GscConnection" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "propertyId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "GscConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ga4Connection" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "propertyId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "Ga4Connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Site_userId_idx" ON "Site"("userId");

-- CreateIndex
CREATE INDEX "Site_domain_idx" ON "Site"("domain");

-- CreateIndex
CREATE INDEX "SiteOntology_siteId_version_idx" ON "SiteOntology"("siteId", "version");

-- CreateIndex
CREATE INDEX "SemanticDebt_siteId_idx" ON "SemanticDebt"("siteId");

-- CreateIndex
CREATE INDEX "SemanticDebt_coverageScore_idx" ON "SemanticDebt"("coverageScore");

-- CreateIndex
CREATE INDEX "SiteAudit_siteId_idx" ON "SiteAudit"("siteId");

-- CreateIndex
CREATE INDEX "SiteKeyword_siteId_idx" ON "SiteKeyword"("siteId");

-- CreateIndex
CREATE INDEX "SiteKeyword_keyword_idx" ON "SiteKeyword"("keyword");

-- CreateIndex
CREATE INDEX "Competitor_siteId_idx" ON "Competitor"("siteId");

-- CreateIndex
CREATE INDEX "ContentPlan_siteId_idx" ON "ContentPlan"("siteId");

-- CreateIndex
CREATE INDEX "PlannedArticle_contentPlanId_idx" ON "PlannedArticle"("contentPlanId");

-- CreateIndex
CREATE INDEX "PlannedArticle_status_idx" ON "PlannedArticle"("status");

-- CreateIndex
CREATE INDEX "GscConnection_siteId_idx" ON "GscConnection"("siteId");

-- CreateIndex
CREATE INDEX "Ga4Connection_siteId_idx" ON "Ga4Connection"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_key" ON "Verification"("identifier");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification"("identifier", "value");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteOntology" ADD CONSTRAINT "SiteOntology_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemanticDebt" ADD CONSTRAINT "SemanticDebt_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemanticDebt" ADD CONSTRAINT "SemanticDebt_ontologyId_fkey" FOREIGN KEY ("ontologyId") REFERENCES "SiteOntology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAudit" ADD CONSTRAINT "SiteAudit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteKeyword" ADD CONSTRAINT "SiteKeyword_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedArticle" ADD CONSTRAINT "PlannedArticle_contentPlanId_fkey" FOREIGN KEY ("contentPlanId") REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GscConnection" ADD CONSTRAINT "GscConnection_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ga4Connection" ADD CONSTRAINT "Ga4Connection_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
