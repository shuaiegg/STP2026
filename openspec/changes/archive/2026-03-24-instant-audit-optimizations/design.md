## Context

Currently, the Instant Audit tool operates as a disconnected sandbox where users enter arbitrary URLs to scan. The results are not persisted via URL parameters, meaning a page refresh wipes the session. Furthermore, because users can scan both their own sites and competitor sites, there is a high risk of polluting the primary Dashboard metrics with competitor semantic debt. To mature the product, audits must be strongly bound to the `Site` model, and competitor data must be structurally isolated.

## Goals / Non-Goals

**Goals:**
- Persist the user's active audit context seamlessly so that sharing links or refreshing the page retains the scanned state.
- Structurally segregate Competitor sites from Owned sites in the database to protect core dashboard aggregates.
- Empower advanced users by providing a 1-click Markdown export of the audit for use with LLMs (ChatGPT/Claude).
- Provide immediate visual feedback (Delta ↑/↓) on whether technical SEO is improving over time.

**Non-Goals:**
- Migrating the current Real-time SSE Scanning Engine to an Asynchronous/Offline Background Job (This is scoped for Phase 2).
- Building a dedicated side-by-side Competitor Analysis dashboard.

## Decisions

### D1: Add `isCompetitor` to `Site` Model & Filter Dashboard Metrics
We will add `isCompetitor Boolean @default(false)` to the Prisma `Site` schema. The Dashboard `getUserData` aggregate queries (Assets, Semantic Debts) will explicitly filter `where: { isCompetitor: false }`.
**Rationale**: This is the cleanest way to allow users to save and track competitor audits indefinitely without artificially inflating their own "Total Planned Articles" or "High Priority Debts".

### D2: Bind Instant Audit strictly to the Site Selector
The free-text domain input on `/instant-audit` will be replaced with logic that binds to the globally selected Site (or prompts the user to add it to their Site list as an Owned or Competitor site).
**Rationale**: Standardizes all auditing under the `Site` entity. This allows the page to automatically fetch the latest `SiteAudit` for the selected `siteId` on mount, elegantly solving the "state wiped on refresh" problem.

### D3: Client-Side Markdown LLM Export
The "Export as Markdown" action will generate the LLM prompt entirely on the client side using the currently rendered `graphData` and `issueReport`.
**Rationale**: Avoids creating a redundant backend endpoint. The data is already in browser memory, and we can use a pure function to map the JSON nodes and issues into a human/LLM-readable Markdown string and pipe it to `navigator.clipboard.writeText`.

## Risks / Trade-offs

- **[Risk] Schema Migration Impact** → Adding a new field to `Site` requires a database migration. Existing sites will default to `isCompetitor: false`, which is perfectly backward compatible, but we must ensure `prisma db push` is executed.
- **[Risk] User Confusion on "Adding Competitors"** → Users might not realize they have to "Add a Site" to do a quick scan. → **[Mitigation]** The empty state of the Instant Audit page will feature a clear dual-action UI: "Scan My Site" vs "Scan Competitor".
