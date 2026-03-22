## 1. Security — Remove Unauthenticated Routes

- [x] 1.1 Delete `src/app/api/test-stellar/route.ts`
- [x] 1.2 Delete `src/app/api/dashboard/test-intelligence/route.ts`
- [x] 1.3 Fix `CRON_SECRET` fallback in `src/app/api/cron/verify/route.ts` line 14 — replace `|| 'dev_secret_only'` with a hard throw/500 when env var is missing

## 2. Security — Fix Self-Referencing HTTP Call

- [x] 2.1 Read `src/app/api/dashboard/sites/[siteId]/semantic-gap/route.ts` to understand the full handler logic
- [x] 2.2 Extract semantic-gap analysis into `src/lib/site-intelligence/semantic-gap-service.ts` as an async function
- [x] 2.3 Update `semantic-gap/route.ts` to call the new service function
- [x] 2.4 Update `src/app/api/dashboard/site-intelligence/audit/route.ts` line 74 to call the service function directly instead of `fetch()`

## 3. Database — Add Missing Indexes

- [x] 3.1 Open `prisma/schema.prisma` and add `@@index([siteId, createdAt(sort: Desc)])` to `SiteAudit` model
- [x] 3.2 Add `@@index([siteId, propertyId])` to `GscConnection` model
- [x] 3.3 Add `@@index([siteId, propertyId])` to `Ga4Connection` model
- [x] 3.4 Add `@@unique([siteId, keyword])` to `SiteKeyword` model (check for existing duplicates first with a Prisma query before applying)
- [x] 3.5 Add `@@index([contentPlanId, status])` to `PlannedArticle` model
- [x] 3.6 Remove redundant `@@index([email])` from `User` model (already covered by `@unique`)
- [x] 3.7 Run `npx prisma migrate dev --name add-performance-indexes` to create and apply the migration

## 4. Performance — Public Pages ISR

- [x] 4.1 Remove `export const dynamic = 'force-dynamic'` from `src/app/(public)/page.tsx`
- [x] 4.2 Remove `export const dynamic = 'force-dynamic'` from `src/app/(public)/blog/page.tsx`
- [x] 4.3 Remove `export const dynamic = 'force-dynamic'` from `src/app/(public)/blog/[slug]/page.tsx`
- [x] 4.4 Remove `export const dynamic = 'force-dynamic'` from `src/app/(public)/blog/category/[slug]/page.tsx`
- [x] 4.5 Verify that `revalidatePath` calls exist in `src/app/actions/sync.ts` for all these paths (should already be present — confirm, don't change)

## 5. Performance — Parallelize DB Queries

- [x] 5.1 In `src/app/(public)/blog/[slug]/page.tsx` lines 18–24, wrap `getPublishedContentBySlug` and `getRelatedContent` in `Promise.all`
- [x] 5.2 In `src/lib/notion/sync.ts` `syncNotionPage()`, wrap the independent `findCategoryByName()` and cover image `uploadImageFromUrl()` calls in `Promise.all`
- [x] 5.3 In `src/lib/notion/sync.ts` `processMarkdownImages()`, replace sequential image uploads with `Promise.allSettled()` to process all images in parallel

## 6. Performance — Fix Over-Fetching

- [x] 6.1 In `src/app/api/dashboard/sites/route.ts`, replace the full `report` include with a `select` that returns only the needed fields (or store `pageCount` as a separate column — choose `select` for minimal change)
- [x] 6.2 In `src/app/api/dashboard/sites/[siteId]/audits/route.ts`, add `select` to exclude `report` from the initial `findMany`; only fetch `report` for the audits that will actually use it
- [x] 6.3 In `src/lib/content.ts` `getPublishedContent()`, add explicit `select` to exclude `contentMd` from list queries (it is only needed in detail views)

## 7. Performance — Cap Unbounded Query

- [x] 7.1 In `src/app/api/skills/execute/route.ts` lines 88–100, replace the `findMany` (all executions) with a `findFirst` that includes the keywords in the `where` clause to detect repeats without loading all history

## 8. Performance — Image Optimization

- [x] 8.1 In `src/app/(public)/blog/category/[slug]/page.tsx` line 55, replace `<img>` with Next.js `<Image>` (add width/height or `fill` prop as appropriate)
- [x] 8.2 In `src/app/(public)/page.tsx`, replace `<img>` tags in the featured posts grid with `<Image>`
- [x] 8.3 In `src/app/(protected)/layout.tsx` lines 150 and 259, replace `<img>` with `<Image>` for logo and user avatar

## 9. Dead Code — Remove Unused Exports

- [x] 9.1 In `src/lib/content.ts`, delete the `publishContent()`, `archiveContent()`, and `generatePreviewToken()` exported functions (verify no callers with a grep first)
- [x] 9.2 In `src/app/actions/user.ts`, delete the `impersonateUser()` stub function
- [x] 9.3 In `src/lib/notion/sync.ts` lines 242–248, remove the 6 dead variable assignments: `seoStatus`, `geoScore`, `seoUpdatedAt`, `keywords`, `metaTitle`, `metaDescription`
- [x] 9.4 In `src/lib/notion/sync.ts`, remove the unused `NotionBlock` type alias

## 10. Dead Code — Deduplication & Fixes

- [x] 10.1 Create `src/lib/auth-utils.ts` with the shared `checkAdmin()` function
- [x] 10.2 Update `src/app/actions/user.ts` to import `checkAdmin` from `src/lib/auth-utils.ts` and remove the local definition
- [x] 10.3 Update `src/app/actions/skills.ts` to import `checkAdmin` from `src/lib/auth-utils.ts` and remove the local definition
- [x] 10.4 In `src/app/actions/skills.ts` lines 73–74, remove the duplicate `revalidatePath('/dashboard/admin/skills')` call
- [x] 10.5 In `src/app/(public)/page.tsx` line 362, fix the copy-paste bug: change card label from `01` to `03`
- [x] 10.6 In `src/lib/utils/seo-scoring.ts` lines 239–241, remove the custom `min()` function and replace all its usages with `Math.min`

## 11. Performance — Batch Sync Progress Writes

- [x] 11.1 In `src/lib/notion/sync.ts` `syncAllNotionPages()`, remove the per-page `SyncLog.update` inside the loop (lines 419–422)
- [x] 11.2 Ensure the final `SyncLog.update` at the end of the function still writes the final `itemsSynced` and `itemsFailed` counts

## 12. Bundle — Remove Unused Packages

- [x] 12.1 Check `node_modules/better-auth/package.json` peerDependencies to confirm `jose` and `bcryptjs` are NOT required by better-auth
- [x] 12.2 Run `npm uninstall jose bcryptjs dotenv` if confirmed unused
- [x] 12.3 Run `npm run build` to verify the build succeeds after removal

## 13. Bundle — Add Dynamic Imports to geo-writer

- [x] 13.1 In `src/app/(public)/tools/geo-writer/page.tsx`, convert `OutlineEditor` import to `next/dynamic` with `ssr: false`
- [x] 13.2 Convert `SEOScorePanel`, `KeywordOpportunityMatrix`, and `SEOScoreDashboard` imports to `next/dynamic` with `ssr: false`
- [x] 13.3 Convert `CompetitorRadarChart`, `SERPOpportunitiesPanel`, and `ContentGapPanel` imports to `next/dynamic` with `ssr: false`
- [x] 13.4 Add appropriate loading fallbacks (spinner or skeleton) for each dynamically imported component

## 14. Bundle — Consolidate DnD Libraries

- [x] 14.1 Read `src/components/dashboard/StrategyBoard.tsx` to understand all current DnD interactions (column drag, card drag, etc.)
- [x] 14.2 Rewrite the DnD logic in `StrategyBoard.tsx` using `@dnd-kit/core` and `@dnd-kit/sortable` (same pattern as `OutlineEditor.tsx`)
- [x] 14.3 Run manual QA: verify columns can be reordered and cards can be moved between columns
- [x] 14.4 Run `npm uninstall @hello-pangea/dnd` after confirming `StrategyBoard.tsx` no longer imports it
- [x] 14.5 Run `npm run build` to verify no remaining imports of `@hello-pangea/dnd`
