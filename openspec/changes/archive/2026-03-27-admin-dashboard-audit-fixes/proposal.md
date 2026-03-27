## Why

The admin dashboard scored 10/20 on an Impeccable design audit, with critical gaps in token discipline (ad-hoc `slate-*`/`gray-*`/`emerald-*` replacing `brand-*` tokens throughout), accessibility failures (missing labels, no keyboard escape, hover-only actions), and hardcoded fake metrics that undermine the platform's "专业·精准·可信" brand positioning. These issues compound as the product scales — token violations make future design changes costly, and accessibility failures block WCAG AA compliance.

## What Changes

- **BREAKING** — All ad-hoc Tailwind color utilities (`slate-*`, `gray-*`, `emerald-*`, `amber-*`, `blue-*`, `indigo-*`, `purple-*`) in admin/dashboard components are replaced with `brand-*` semantic tokens; missing tokens (`brand-info`, `brand-admin`) added to `globals.css`
- Hardcoded fake metrics ("活跃度 85%", "平均成功率: 99.2%") in the Admin Overview replaced with real computed values from the database
- All icon-only buttons and search inputs in admin pages receive proper `aria-label` / `aria-current` attributes
- Dropdown menus (TopNav site switcher, user menu) gain `Escape` key dismiss and keyboard arrow navigation
- TopNav gains a mobile hamburger/drawer for the center nav links hidden at `< md`
- Hover-dependent action controls in the users table (credit +/−, impersonate button) become always-visible or touch-accessible
- `<img>` tag for user avatars replaced with `next/image`
- Sync page emoji spinner (`🔄`) replaced with `<Loader2>`, and page layout aligned with dashboard standard
- Billing recommended card removes `scale-105` in favor of `ring-2` highlight
- All `rounded-2xl` icon containers corrected to `rounded-lg`
- Admin Overview chart placeholder replaced with a proper empty state (with GA4 connect CTA)

## Capabilities

### New Capabilities

- `admin-token-normalization`: Systematic replacement of ad-hoc Tailwind colors with `brand-*` tokens across all admin/dashboard components; addition of missing semantic tokens (`brand-info`, `brand-admin`) to the design system
- `admin-accessibility`: WCAG AA compliance for admin dashboard — aria-labels, keyboard navigation, aria-current, focus management
- `admin-mobile-nav`: Mobile-responsive TopNav with hamburger/drawer for the hidden center nav links

### Modified Capabilities

- `design-system-tokens`: Adding two new semantic token groups — `brand-info` (blue scale for informational states) and `brand-admin` (purple scale for admin role badge) — to `globals.css` and `@theme inline` block

## Impact

- **Files modified**: `DashboardShell.tsx`, `TopNav.tsx`, `admin/page.tsx`, `admin/content/page.tsx`, `admin/sync/page.tsx`, `admin/(admin-only)/users/page.tsx`, `billing/BillingClient.tsx`, `globals.css`
- **Design system**: `globals.css` gains new CSS custom properties; consumers using the old ad-hoc colors will need to be migrated (covered in `admin-token-normalization`)
- **No API / schema changes**
- **Audience**: Dashboard (expert/operational) — visual register must stay dense and data-forward, not simplify toward the public/beginner register
