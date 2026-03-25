## 1. Fix Hero Animation (globals.css + page.tsx)

- [x] 1.1 In `src/app/globals.css`, change `.animate-slide-in-up` from `animation-fill-mode: forwards` to `animation-fill-mode: both` (update the shorthand `animation:` value to include `both`)
- [x] 1.2 In `src/app/(public)/page.tsx`, remove the `opacity-0` class from the hero badge wrapper `<div>` (line ~230)
- [x] 1.3 In `src/app/(public)/page.tsx`, remove the `opacity-0` class from the `<h1>` element (line ~236)
- [x] 1.4 In `src/app/(public)/page.tsx`, remove the `opacity-0` class from the `<p>` subtitle element (line ~244)
- [x] 1.5 In `src/app/(public)/page.tsx`, remove the `opacity-0` class from the CTA button wrapper `<div>` (line ~248)
- [x] 1.6 Verify no other files use `.animate-slide-in-up` with a companion `opacity-0` class (grep check)

## 2. Fix TopNav `activeSiteId` Crash

- [x] 2.1 In `src/components/dashboard/TopNav.tsx` line 184, replace `activeSiteId` with `currentSiteId` in the `aria-selected` expression
- [x] 2.2 In `src/components/dashboard/TopNav.tsx` line 192, replace `activeSiteId` with `currentSiteId` in the conditional font-weight class
- [x] 2.3 In `src/components/dashboard/TopNav.tsx` line 197, replace `activeSiteId` with `currentSiteId` in the check-icon conditional render

## 3. Fix Dashboard Tab Navigation (OverviewPanel)

- [x] 3.1 In `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/OverviewPanel.tsx`, replace the GSC `IntegrationGuidanceCard` (`href="#integrations"`) with a `<button>` that calls `onSwitchTab?.('integrations')`, styled to match the existing card appearance
- [x] 3.2 Replace the GA4 `IntegrationGuidanceCard` (`href="#integrations"`) with a `<button>` that calls `onSwitchTab?.('integrations')`
- [x] 3.3 Replace the content-plan `IntegrationGuidanceCard` (`href="#strategy"`) with a `<button>` that calls `onSwitchTab?.('strategy')`
- [x] 3.4 Confirm `IntegrationGuidanceCard` still accepts an `onClick` prop OR update the component to accept `onClick?: () => void` instead of (or in addition to) `href` so the button-style variant renders correctly with the same icon/lock/CTA layout

## 4. Fix Semantic Debt Inline Expansion (OverviewPanel)

- [x] 4.1 In `OverviewPanel.tsx`, add a `COPY` entry for the debt detail CTA: `debtDetailCta: '去策略板查看'`
- [x] 4.2 Below each debt item `<div>` in the `.map()`, render a conditional expansion block: when `selectedDebt?.topic === debt.topic`, show a bordered detail row with topic name, coverage score badge, and a "去策略板查看" button
- [x] 4.3 Wire the "去策略板查看" button to call `onSwitchTab?.('strategy')` and set `setSelectedDebt(null)`
- [x] 4.4 Verify the expand/collapse toggle works: clicking an expanded row calls `handleDebtClick` which resets `selectedDebt` to `null`
