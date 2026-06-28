-- AlterTable: 关联站点 + 来源支柱（均可空，存量行为 NULL，零影响）
ALTER TABLE "TrackedArticle" ADD COLUMN "siteId" TEXT;
ALTER TABLE "TrackedArticle" ADD COLUMN "sourcePillar" TEXT;

-- CreateIndex
CREATE INDEX "TrackedArticle_siteId_idx" ON "TrackedArticle"("siteId");
