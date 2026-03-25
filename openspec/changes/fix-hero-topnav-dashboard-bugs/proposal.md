## Why

Three production bugs are causing broken UI on both the public homepage and the authenticated dashboard: the hero section is invisible (content stuck at opacity:0), the TopNav crashes on site-switching, and dashboard action cards silently fail to navigate. These are user-facing regressions that need immediate fixes.

## What Changes

- **Hero animation fix**: Remove `opacity-0` Tailwind utility from hero elements that also carry `animate-slide-in-up`; use `animation-fill-mode: both` so the CSS keyframe governs opacity for the full lifecycle (delay + run + hold).
- **TopNav crash fix**: Replace the three undefined `activeSiteId` references with the correct prop `currentSiteId` in the site-switcher dropdown (lines 184, 192, 197 of `TopNav.tsx`).
- **Dashboard tab navigation fix**: Replace hash-`href` links in `IntegrationGuidanceCard` usages inside `OverviewPanel` with `onSwitchTab` callback calls, so clicking GSC / GA4 / content-strategy cards actually switches the tab.
- **高优语义债 click feedback**: Wire `selectedDebt` state to a visible expanded detail row (or remove the dead click handler) so interaction has a visible outcome.

## Capabilities

### New Capabilities

- `hero-animation`: CSS animation lifecycle for the homepage hero — opacity-0 initial state, keyframe-driven reveal, stagger delays, no flash-of-invisible-content.
- `dashboard-tab-deep-link`: OverviewPanel action cards navigate to specific tabs via `onSwitchTab` callback rather than hash href anchors.
- `semantic-debt-detail`: Clicking a semantic-debt item in OverviewPanel expands an inline detail view showing the debt's topic and coverage score.

### Modified Capabilities

- `homepage-acquisition`: Hero section animation behavior changes (no spec-level requirement change beyond correct visibility).
- `dashboard-site-workbench-layout`: `TopNav` activeSiteId reference corrected; no behavior change, just crash fix.

## Impact

- `src/app/(public)/page.tsx` — hero section class changes
- `src/app/globals.css` — `.animate-slide-in-up` fill-mode update
- `src/components/dashboard/TopNav.tsx` — 3-line rename
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/OverviewPanel.tsx` — replace 3 `IntegrationGuidanceCard` usages + wire `selectedDebt` display
- No database changes, no API changes, no new dependencies
