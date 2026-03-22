## Why

Production pages are loading slowly due to disabled caching on all public routes, unoptimized database queries, and over-fetching. Additionally, two unauthenticated test API routes pose live security and cost risks. This cleanup removes technical debt accumulated during rapid development and establishes safer, faster defaults.

## What Changes

### Security Fixes
- **REMOVE** `src/app/api/test-stellar/route.ts` — unauthenticated route triggering real LLM calls
- **REMOVE** `src/app/api/dashboard/test-intelligence/route.ts` — unauthenticated full site audit route
- Fix `CRON_SECRET` fallback in `api/cron/verify/route.ts` — replace hardcoded `'dev_secret_only'` with a hard failure
- Extract self-referencing HTTP call in `audit/route.ts` into a shared service function

### Performance Fixes
- Remove `force-dynamic` from all 4 public pages — enable on-demand ISR (revalidatePath already handles invalidation)
- Parallelize independent DB queries on `/blog/[slug]` using `Promise.all`
- Fix over-fetching in `sites/route.ts` and `audits/route.ts` — use `select` to avoid loading full `report` JSON blobs
- Add 5 missing/improved Prisma DB indexes; remove 1 redundant index
- Cap unbounded `skillExecution.findMany` with `findFirst` for repeat detection
- Parallelize cover image upload + category lookup in `syncNotionPage()` with `Promise.all`
- Replace 4 bare `<img>` tags with Next.js `<Image>` on public-facing pages
- Add `next/dynamic` lazy loading to heavy components in `geo-writer/page.tsx`

### Dead Code Removal
- Remove unused exports: `publishContent`, `archiveContent`, `generatePreviewToken`, `impersonateUser`
- Remove 6 dead Notion property reads in `sync.ts` (seoStatus, geoScore, seoUpdatedAt, keywords, metaTitle, metaDescription)
- Deduplicate `checkAdmin()` into shared `src/lib/auth-utils.ts`
- Remove duplicate `revalidatePath` call in `actions/skills.ts:73-74`
- Fix homepage copy-paste bug: third card label `01` → `03`
- Replace custom `min()` re-implementation with `Math.min` in `seo-scoring.ts`
- Batch sync progress DB writes — update at end of run, not after every page

### Bundle Size Reduction
- Remove unused packages: `jose`, `bcryptjs`, `dotenv`
- Standardize on `@dnd-kit/*` — remove `@hello-pangea/dnd` and migrate `StrategyBoard.tsx`

## Capabilities

### New Capabilities
- `auth-utils`: Shared admin/auth helper utilities extracted from duplicated action files

### Modified Capabilities
- None — all changes are implementation-level; no spec-level behavior changes to existing capabilities

## Impact

**Files modified:**
- `prisma/schema.prisma` — new indexes, removed redundant index
- `src/app/(public)/page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `blog/category/[slug]/page.tsx` — ISR + Image fixes
- `src/lib/notion/sync.ts` — parallelization, dead code removal, batched progress writes
- `src/lib/content.ts` — remove unused exports, fix over-fetching select
- `src/app/api/dashboard/sites/route.ts`, `[siteId]/audits/route.ts` — fix over-fetching
- `src/app/api/skills/execute/route.ts` — cap unbounded query
- `src/app/api/cron/verify/route.ts` — fix CRON_SECRET fallback
- `src/app/api/dashboard/site-intelligence/audit/route.ts` — remove self-referencing HTTP call
- `src/app/actions/skills.ts`, `user.ts`, `content.ts` — dead code + deduplication
- `src/lib/utils/seo-scoring.ts` — remove custom `min()`
- `src/components/dashboard/StrategyBoard.tsx` — migrate to @dnd-kit
- `src/app/(public)/tools/geo-writer/page.tsx` — add dynamic imports

**Files deleted:**
- `src/app/api/test-stellar/route.ts`
- `src/app/api/dashboard/test-intelligence/route.ts`

**Files created:**
- `src/lib/auth-utils.ts`

**Dependencies removed:** `jose`, `bcryptjs`, `dotenv`, `@hello-pangea/dnd`

**DB schema change:** Additive indexes only + remove one redundant index — no data migration required
