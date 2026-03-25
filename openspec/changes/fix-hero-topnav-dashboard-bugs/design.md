## Context

Three independent bugs regressed in the same release cycle:

1. **Hero blank** — `src/app/(public)/page.tsx` applies `opacity-0` (Tailwind utility) alongside `animate-slide-in-up` (custom CSS class in globals.css). In Tailwind v4's cascade layer model, the keyframe animation correctly takes over `opacity` during the run, but because `animation-fill-mode` is only `forwards` (not `both`), elements are still governed by the Tailwind `opacity-0` utility during the animation-delay period. On slower connections / first render the delay is long enough for users to see a blank section — and if the animation fails to fire (e.g. reduced-motion, paint-hold), the element stays invisible permanently.

2. **TopNav crash** — During a dashboard UI refactor, the site-switcher dropdown was updated to use a prop-based "active site" pattern. The prop was named `currentSiteId` but three JSX expressions inside the dropdown still reference `activeSiteId`, which is never declared in the component scope. React throws a ReferenceError when the dropdown opens.

3. **Dashboard tab navigation** — `IntegrationGuidanceCard` receives an `href` prop and renders a `<Link>`. In the `OverviewPanel`, the hrefs are hash anchors on the current page (e.g. `#integrations`). The `TabContainer` reads `window.location.hash` in a `useEffect` with an empty dependency array — it runs only on mount. Navigation to a hash on the same already-mounted page does not remount the component, so the tab never switches. The `selectedDebt` click state has no corresponding render path (the state is set but never read).

## Goals / Non-Goals

**Goals:**
- Hero section content is fully visible on load across all connection speeds and motion preferences.
- TopNav site-switcher dropdown opens without a JS crash.
- Clicking GSC / GA4 / content-strategy guidance cards navigates the user to the correct tab.
- Clicking a semantic-debt item shows an inline expanded detail row.
- Zero new dependencies introduced.

**Non-Goals:**
- Redesigning the hero animation system beyond the minimal fix.
- Refactoring TabContainer to a URL-router–driven tab model.
- Adding persistent cross-session state for expanded debt items.

## Decisions

### 1. Hero: remove `opacity-0`, set fill-mode to `both`

**Decision**: Delete the `opacity-0` Tailwind class from hero elements and change `animation-fill-mode` in `.animate-slide-in-up` from `forwards` to `both`.

**Rationale**: With `fill-mode: both`, the keyframe's `from` state (opacity 0, translateY 30px) applies during the pre-delay period, replacing the need for the explicit `opacity-0` class. The `to` state (opacity 1) is held after the animation completes. This eliminates the two-source-of-truth problem without touching the keyframe definition.

**Alternative considered**: Keep `opacity-0` and add `animation-fill-mode: backwards` via an additional utility class. Rejected because it requires adding markup noise and still does not fix the permanent-invisible case when animations are suppressed.

### 2. TopNav: rename `activeSiteId` → `currentSiteId`

**Decision**: Three textual replacements in `TopNav.tsx`.

**Rationale**: The variable was renamed at the prop level but not in the 3 JSX expression sites. No behavioral change is needed; this is a pure correctness fix.

### 3. OverviewPanel: replace hash-href with `onSwitchTab` callback

**Decision**: Convert the three `IntegrationGuidanceCard` usages from `<Link href="...#tab">` to `<button onClick={() => onSwitchTab?.('tab')}>` styled identically.

**Rationale**: `onSwitchTab` is already wired through `TabContainer → OverviewPanel` and successfully switches tabs (used by the competitors card). The hash-href approach requires a page remount or a hash-change event listener to work on an already-mounted page. Adding a hash-change listener to `TabContainer` is a valid alternative but adds complexity; using the existing callback is zero-overhead.

**Alternative considered**: Add a `hashchange` event listener in `TabContainer`'s `useEffect`. Rejected as over-engineering — the callback path already exists and is proven to work.

### 4. Semantic debt: inline expanded detail row

**Decision**: When `selectedDebt` is non-null, render a collapsible row beneath the clicked debt item showing topic name, coverage score, and a "去策略板查看" button that calls `onSwitchTab?.('strategy')`.

**Rationale**: The click handler and state already exist. The expansion pattern is already used elsewhere in the dashboard (e.g. audit history rows). This is the minimum interaction that makes the click meaningful without requiring a new route or modal.

## Risks / Trade-offs

- **`fill-mode: both` affects all consumers of `.animate-slide-in-up`** → Any element using this class that also sets an initial visible state via a non-opacity class could see a flash. Audit all usages before shipping. Low risk — the class is only used in the homepage hero.
- **`onSwitchTab` is optional (`onSwitchTab?`)** → If `OverviewPanel` is ever rendered outside `TabContainer`, the buttons silently do nothing. Acceptable for now; add a required prop later if usage expands.
- **Debt detail row uses local state** → Navigating away and back resets it. Expected behavior for a lightweight inline expansion.
