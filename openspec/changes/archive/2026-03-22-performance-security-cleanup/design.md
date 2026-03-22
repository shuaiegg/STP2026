## Context

ScaletoTop is a Next.js 16 App Router platform serving a public blog/marketing site and a protected dashboard. The platform was built quickly for launch and several pragmatic shortcuts were taken: all public pages use `force-dynamic` (likely to avoid ISR cache issues during development), two test API routes were never removed, and utility functions were duplicated across action files. These decisions are now causing measurable production slowdowns and carry security risk.

Current state of the problems:
- Every public page request hits the database directly — no edge caching, no ISR
- Two API routes are callable without authentication and trigger real compute (LLM calls, full site crawl)
- Database queries over-fetch large JSON blobs for simple list UIs
- Five missing compound DB indexes cause full table scans on the most-queried tables
- ~130KB of duplicate DnD library code ships in the bundle from two competing libraries

## Goals / Non-Goals

**Goals:**
- Eliminate force-dynamic from public pages so Next.js edge cache serves repeat visitors
- Remove all unauthenticated compute-triggering routes from production
- Fix the 3 most impactful DB query inefficiencies (over-fetching, missing indexes, unbounded queries)
- Reduce client JS bundle size by removing duplicate DnD library and adding lazy loading
- Remove dead code to reduce maintenance surface

**Non-Goals:**
- Rewriting the AI skills system or Notion sync architecture
- Adding new features or changing user-visible behavior
- Migrating off Supabase or changing the ORM
- Full component-level performance profiling (Lighthouse audit, Core Web Vitals measurement)
- Migrating off better-auth

## Decisions

### D1: ISR Strategy for Public Pages

**Decision**: Remove `force-dynamic` and rely entirely on `revalidatePath()` calls in sync actions for cache invalidation. No explicit `revalidate` interval.

**Rationale**: The sync flow already calls `revalidatePath('/blog')`, `revalidatePath('/')`, and per-slug paths after every sync. This means content is always fresh within seconds of a Notion sync. Adding a timed `revalidate = 3600` would be redundant. With no revalidate and no force-dynamic, pages are statically generated at first request and served from cache until next sync.

**Alternative considered**: `export const revalidate = 3600` (hourly ISR). Rejected because it adds unnecessary re-renders when content hasn't changed; on-demand revalidation via revalidatePath is already in place and more precise.

**Risk**: If a sync fails mid-run (some pages synced, some not), the cache may be partially stale. Acceptable — this is the same risk as before but now the successfully-synced pages serve fast.

---

### D2: Shared `auth-utils.ts` for checkAdmin

**Decision**: Create `src/lib/auth-utils.ts` with a single exported `checkAdmin()` function. Both `actions/user.ts` and `actions/skills.ts` import from it.

**Rationale**: The identical 10-line function is duplicated in two files. Any future change to admin auth logic (e.g., adding EDITOR role support) would require updating both. A shared utility is the correct abstraction.

**Alternative considered**: Keep duplication, add a comment. Rejected — this is a code smell that will silently diverge.

---

### D3: Fix Self-Referencing HTTP in audit/route.ts

**Decision**: Extract the semantic-gap analysis logic into a shared service function at `src/lib/site-intelligence/semantic-gap-service.ts` and call it directly from both `audit/route.ts` and `semantic-gap/route.ts`.

**Rationale**: The current `fetch()` call from one API route to another on the same server adds a full HTTP round-trip, bypasses the request auth context cleanly, and can silently fall back to `http://localhost:3000` in production. Service functions are the correct pattern in Next.js App Router.

**Alternative considered**: Pass the `siteId` to a server action. Rejected — server actions add cache semantics that aren't needed here; a plain async function is simpler.

---

### D4: DnD Library Consolidation

**Decision**: Standardize on `@dnd-kit/*` and migrate `StrategyBoard.tsx` from `@hello-pangea/dnd`.

**Rationale**: `@dnd-kit` is more actively maintained, has better TypeScript support, and is already used in `OutlineEditor.tsx`. Migrating the strategy board's drag-and-drop (column sorting only) is straightforward. `@hello-pangea/dnd` is a fork of the abandoned `react-beautiful-dnd` and adds ~50KB to the bundle for no unique capability.

**Alternative considered**: Keep `@hello-pangea/dnd` and migrate OutlineEditor. Rejected — @dnd-kit has broader feature set and the OutlineEditor migration would be more complex.

---

### D5: Notion Sync Progress Batching

**Decision**: Remove per-page `SyncLog` progress updates. Write only the final result to the SyncLog after all pages complete (or after a batch of 10 pages as a middle ground).

**Rationale**: The current code writes a DB update after every single page. For a 100-page sync this is 100 unnecessary writes. The SyncLog is only read in the admin UI after sync completion — intermediate progress is not displayed anywhere in the UI.

**Alternative considered**: Update every 10 pages. Rejected for initial implementation — simpler to just update at the end, matching what the admin UI actually reads.

---

### D6: DB Indexes

**Decision**: Add compound indexes via Prisma schema changes using `npx prisma migrate dev` (not `db push`) since this will go to production.

Indexes to add:
- `SiteAudit`: `@@index([siteId, createdAt(sort: Desc)])` — covers the always-present ORDER BY pattern
- `GscConnection`: `@@index([siteId, propertyId])`
- `Ga4Connection`: `@@index([siteId, propertyId])`
- `SiteKeyword`: `@@unique([siteId, keyword])` — also prevents duplicate rows
- `PlannedArticle`: `@@index([contentPlanId, status])`

Index to remove:
- `User`: `@@index([email])` — redundant with `@unique` constraint

**Rationale**: All of these tables are queried with the compound condition in production. Missing indexes cause sequential scans as data grows.

---

### D7: lazy loading in geo-writer

**Decision**: Wrap `OutlineEditor`, `SEOScorePanel`, `KeywordOpportunityMatrix`, `SEOScoreDashboard`, `CompetitorRadarChart`, `SERPOpportunitiesPanel`, and `ContentGapPanel` in `next/dynamic` with `ssr: false`.

**Rationale**: These are heavy client-only components (one imports all of @dnd-kit, others import recharts). They are only rendered when the user has run the GEO writer — not on initial page load. Lazy loading reduces the initial JS bundle for this route significantly.

**Alternative considered**: Move to a separate route. Rejected — UX continuity requires them on the same page.

## Risks / Trade-offs

**[Risk] ISR cache cold start on low-traffic pages** → First visitor after a sync triggers a DB query; subsequent visitors get cached response. Acceptable for this traffic level.

**[Risk] StrategyBoard DnD regression** → Migrating from `@hello-pangea/dnd` to `@dnd-kit` requires manual testing of drag-and-drop column reordering. Mitigation: implement using the same `useSortable` pattern already used in OutlineEditor.

**[Risk] SiteKeyword `@@unique([siteId, keyword])` migration may fail if duplicates exist** → Run a dedup query before the migration. The migration task includes this pre-step.

**[Risk] Removing `jose` and `bcryptjs`** → Verify these are truly unused and not required by `better-auth` as peer dependencies before removing from `package.json`. Mitigation: check `node_modules/better-auth/package.json` peerDependencies.

**[Risk] Semantic gap service extraction** → If `semantic-gap/route.ts` has request-specific logic (headers, cookies), extracting it to a service function may require passing additional parameters. Mitigation: audit the handler before extracting.

## Migration Plan

1. **Schema changes first** — run `prisma migrate dev` for indexes before any code changes go live
2. **Security deletions** — remove test routes immediately, they're pure risk
3. **Performance fixes** — ISR change is a single-line removal per file, low risk
4. **Dead code removal** — mechanical, low risk
5. **DnD migration** — requires manual QA of StrategyBoard after deploy
6. **Bundle optimizations** — verify geo-writer page loads correctly after dynamic import changes

**Rollback**: All changes are reversible. ISR can be reverted to force-dynamic with one line. DB indexes can be dropped. No data migrations.

## Open Questions

- Does `better-auth` list `jose` or `bcryptjs` as peer dependencies? (Check before removing)
- Are there any external cron or monitoring services polling `test-stellar` or `test-intelligence` routes that need to be notified before removal?
- Is the StrategyBoard column drag-and-drop the only DnD interaction in that component, or are there row-level interactions too?
