## 1. Schema & Data Layer Updates

- [x] 1.1 In `prisma/schema.prisma`, add `isCompetitor Boolean @default(false)` to the `Site` model.
- [x] 1.2 Run `npx prisma generate` and `npx prisma db push` to apply the database changes.
- [x] 1.3 In `src/app/api/dashboard/sites/route.ts`, update the POST handler to accept and save an optional `isCompetitor` flag when creating a new site. (Also updated `save/route.ts`)
- [x] 1.4 In `src/app/(protected)/dashboard/page.tsx`, update the `getUserData` aggregate queries (PlannedArticle count, SemanticDebt count and findMany) to include `where: { isCompetitor: false }` or `{ site: { isCompetitor: false } }`.

## 2. Competitor Isolation & Selector Logic

- [x] 2.1 Identify the global Site Selector component (Header or DashboardContent) and update its data fetching to include `isCompetitor`.
- [x] 2.2 Refactor the Site Selector dropdown UI to group sites into visual sections: "My Sites" and "Competitors".
- [x] 2.3 Ensure adding a competitor site through the UI successfully passes `isCompetitor: true` to the API.

## 3. Instant Audit Binding & UI Overhaul

- [x] 3.1 In `src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx`, remove the free-text `domain` input textbox.
- [x] 3.2 Update the page to determine the `activeSiteId` either from the URL (`?siteId=`) or the globally selected site in context/localStorage.
- [x] 3.3 Implement an auto-load `useEffect`: If `activeSiteId` exists but no `auditIdToLoad` is present, fetch the latest audit for that site and set it as active.
- [x] 3.4 Update the `handleSaveSite` function to use `router.replace` to inject `?siteId=X&auditId=Y` into the URL upon successful save.
- [x] 3.5 The empty state of the Instant Audit page now features a clear dual-action UI: "Scan My Site" vs "Scan Competitor".
- [x] 3.6 Implement the "Unbind & Replace" UI warning for users attempting to overwrite an existing site limit.

## 4. LLM Export & Visual Delta

- [x] 4.1 In `InstantAuditInner`, implement a `handleExportMarkdown` utility to serialize audit data (Score, Node Summary, Issues).
- [x] 4.2 Add a "Export as Markdown" button to the results HUD using the `Copy` icon from `lucide-react`.
- [x] 4.3 Ensure the copied Markdown includes a system prompt: "You are an expert SEO Strategist...".
- [x] 4.4 Update the `HealthReport` component to display a "Delta" banner comparing new vs. fixed issues against the previous audit.
- [x] 4.5 Render visual trend indicators (↑/↓) next to numerical tech scores if historical data is available.

## 5. Polish & Verification

- [x] 5.1 Verify that competitor sites are successfully filtered out of the global dashboard metrics.
- [x] 5.2 Ensure no brutalist classes or hardcoded hex colors were introduced in the new UI components.
- [x] 5.3 Run `/web-design-guidelines` skill check if applicable and resolve any reported UI issues.
