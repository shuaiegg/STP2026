## Why

Currently, the Instant Audit tool operates as a disconnected sandbox: refreshing the page loses the scanned results, competitors and owned sites are not cleanly separated, and the rich data generated cannot be easily exported for LLM-assisted analysis. This creates a disjointed user experience where users cannot reliably return to past scans or leverage the AI ecosystem. Optimizing this flow is critical to elevating the tool from a "toy scanner" to a core strategic asset.

## What Changes

- **Site-Bound Persistence (BREAKING)**: Replace the free-text domain input with a mandatory Site dropdown selector. All Instant Audits will now be permanently tied to a selected `Site` record, and the UI will automatically load the latest audit for the active site.
- **Competitor Segregation**: Add an `isCompetitor` flag to the `Site` model. The Site dropdown will group "My Sites" vs "Competitors". Competitor sites will be excluded from the global dashboard aggregate metrics.
- **Unbind/Replace Flow**: For users at their Site quota limit, introduce an explicitly warned "Unbind & Replace" flow inside the dropdown to swap out the active domain.
- **LLM Markdown Export**: Introduce a "Copy as Markdown" action that transforms the visual Starmap (GalaxyGraph), Tech Score, and Issue Summary into an LLM-optimized prompt context format copied to the user's clipboard.
- **Visual Delta Indicators**: Add baseline comparison UI (↑ / ↓) next to the Tech Score and Issue Counts, calculating the delta against the immediate previous audit for that site.

## Capabilities

### New Capabilities
- `instant-audit-persistence`: Binding the audit execution tool statically to the Site selector context, dropping the ad-hoc input, and auto-loading latest states via URL and backend queries.
- `competitor-site-isolation`: Introducing the `isCompetitor` data model field, grouping sites in selectors, and filtering competitor data strictly out of primary dashboard aggregations.
- `llm-markdown-export`: A utility to serialize the parsed frontend Audit Data (Business DNA, Node Graph, Issues) into a structured Markdown template designed for LLM (ChatGPT/Claude) context consumption.

### Modified Capabilities
- `audit-delta-comparison`: Extending the existing visual representation to calculate and render historical offsets (positive/negative score shifts) for instantaneous feedback.
- `global-dashboard-metrics`: Excluding sites marked as `isCompetitor: true` from the `getUserData` aggregate Prisma query counts.

## Impact

- `src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx`: Major UI overhaul changing the input flow to a dropdown and adding auto-fetching logic.
- `src/app/api/dashboard/sites/route.ts` & Prisma Schema (`schema.prisma`): Adding `isCompetitor` to `Site` (requires Prisma migration) and updating queries.
- `src/app/(protected)/dashboard/page.tsx`: Refining global metrics query to filter out competitors.
