## Context

The admin dashboard is a dense operational UI used by ADMIN/EDITOR roles to manage content, users, and platform health. An Impeccable audit (score: 10/20) identified three systemic gaps:

1. **Token discipline failure**: Developers bypassed the `brand-*` token system and used raw Tailwind utilities (`slate-*`, `gray-*`, `emerald-*`, etc.) directly. The root cause is that the token system lacks semantic slots for "informational" (blue) and "admin role" (purple) states, forcing developers off the path of least resistance.

2. **Accessibility debt**: No Escape-key handling on dropdowns, missing `aria-label` on icon buttons and search inputs, hover-dependent critical actions. These are mechanical omissions, not architectural problems.

3. **Data integrity**: The Admin Overview displays hardcoded fake metrics ("活跃度 85%", "平均成功率: 99.2%") and a placeholder chart. These are placeholders that were never removed.

## Goals / Non-Goals

**Goals:**
- Bring all admin/dashboard components to full `brand-*` token compliance
- Achieve WCAG AA across all admin pages (contrast, keyboard nav, ARIA)
- Make TopNav fully functional on mobile with a drawer for the hidden nav links
- Replace all fake/placeholder data with real computed values or honest empty states
- Make user table actions (credit management, impersonate) accessible on touch devices

**Non-Goals:**
- Refactoring component architecture beyond what's needed for the fixes
- Adding new admin features or data visualizations beyond the empty state upgrade
- Changing any public-facing (non-dashboard) pages
- Dark mode for the admin dashboard (tokens will be correct, but dark variants are a separate change)

## Decisions

### Decision 1: Add `brand-info` and `brand-admin` tokens rather than mapping to existing tokens

**Decision**: Add two new semantic token groups to `globals.css`:
- `--brand-info-*` (blue scale: bg, text, border) for informational UI states
- `--brand-admin-*` (purple scale) for the ADMIN role badge

**Rationale**: Without these tokens, developers will continue to reach for raw `blue-*` and `purple-*`. Providing the path of least resistance in the token system prevents recurrence. These are semantically distinct from `brand-secondary` (emerald, for positive/CTA) and `brand-accent` (amber, for attention/warning).

**Alternatives considered**:
- Reuse `brand-secondary` for info states — rejected because emerald reads as "success/positive", not "informational"
- Leave it as raw utilities — rejected as it defeats the audit's purpose

### Decision 2: Mobile nav as a slide-in drawer, not a bottom tab bar

**Decision**: Add a hamburger button to TopNav that opens a full-height left drawer containing all nav links (including admin links for ADMIN/EDITOR users).

**Rationale**: The dashboard is operationally dense. A bottom tab bar limits to ~4-5 items and creates a two-tier navigation mental model. A drawer matches the existing pattern used in similar B2B SaaS tools (Linear, Vercel) and handles the variable number of admin links gracefully.

**Alternatives considered**:
- Bottom tab bar — rejected: too few slots, requires reordering information architecture
- Expand the existing top nav to wrap — rejected: breaks the single-line sticky nav pattern

### Decision 3: Replace hover-gated user table actions with an always-visible "三点菜单" (kebab menu)

**Decision**: Remove `opacity-0 group-hover:opacity-100` from the users table action column. Replace with a kebab (`MoreVertical`) button that is always visible and opens a small dropdown with "调整积分" and "代理登录" options.

**Rationale**: Hover-gating critical management actions is a desktop-only pattern that completely breaks on touch. A kebab menu is universally understood, touch-friendly, and keeps the table visually clean at rest.

**Alternatives considered**:
- Make actions always visible inline — rejected: too visually noisy with 3+ columns of controls
- Long-press to reveal — rejected: non-standard, not discoverable

### Decision 4: Fake metrics → real Prisma queries, not removed

**Decision**: Replace "活跃度 85%" and "平均成功率: 99.2%" with real computed values derived from existing Prisma data. "活跃度" = % of users with at least one `skillExecution` in the last 30 days. "成功率" = `skillExecution` success count / total count.

**Rationale**: Removing the fields entirely would create an information gap in the admin overview. The data is already available in the DB via the existing `skillExecution` query in `getStats()` — it just needs to be computed correctly.

### Decision 5: Chart placeholder → structured empty state with GA4 CTA

**Decision**: Replace the "数据图表加载中..." div with a proper empty state component: icon + heading + description + "连接 GA4" button linking to `/dashboard/admin/site-intelligence` settings.

**Rationale**: An empty state is honest and actionable. It removes the impression of broken functionality and gives the admin a clear next step.

## Risks / Trade-offs

- **Token rename blast radius**: Replacing `slate-*`/`gray-*` with `brand-*` touches 7+ files. Risk: visual regression in edge cases (e.g., a `slate-100` used as a divider might map slightly differently to `brand-border`). Mitigation: map each case explicitly rather than doing a global find-replace; verify visually after each file.

- **New CSS tokens are a breaking change**: Any external code (if any) relying on the absence of `--brand-info-*` or `--brand-admin-*` will be unaffected (adding is not breaking), but any code directly consuming the old ad-hoc colors that is not in this change's scope may drift. Mitigation: document new tokens in `rules/design.md` immediately.

- **Drawer adds JS bundle**: The mobile drawer requires a new `useState` in TopNav (which is already `'use client'`). Minimal impact.

- **Keyboard navigation in drawer**: If not implemented carefully, the drawer can create a keyboard trap. Mitigation: use `focus-trap` pattern (close on Escape, return focus to trigger on close).

## Migration Plan

1. Add new CSS tokens to `globals.css` first (non-breaking)
2. Update `rules/design.md` with new token documentation
3. Migrate files in order: `DashboardShell` → `TopNav` → `admin/page` → `content/page` → `sync/page` → `users/page` → `BillingClient`
4. Each file migration is independently deployable — no DB migrations required
5. Rollback: all changes are CSS class replacements; revert any file independently via git

## Open Questions

- Should the mobile drawer also surface the site-switcher functionality, or only the nav links? (Recommendation: nav links only for V1; site switcher stays in the top area)
- Should `brand-admin` purple be the same hue as the existing `purple-600` used in the ADMIN badge, or a custom value that better aligns with the brand palette?
