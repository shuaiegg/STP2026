## 1. Design System — Add Missing Tokens

- [x] 1.1 Add `--brand-info`, `--brand-info-hover`, `--brand-info-muted` CSS variables to `:root` in `src/app/globals.css`
- [x] 1.2 Add `--brand-admin`, `--brand-admin-muted`, `--brand-admin-border` CSS variables to `:root` in `src/app/globals.css`
- [x] 1.3 Expose both new token groups in the `@theme inline` block as `--color-brand-info-*` and `--color-brand-admin-*`
- [x] 1.4 Document both new token groups in the Token Reference table in `rules/design.md`

## 2. Token Normalization — Core Layout

- [x] 2.1 `DashboardShell.tsx`: Replace `bg-slate-50` with `bg-brand-surface`
- [x] 2.2 `TopNav.tsx`: Replace all `gray-*` and `slate-*` utilities with `brand-*` equivalents (`border-brand-border`, `bg-brand-surface-alt`, `text-brand-text-primary`, `text-brand-text-secondary`, `text-brand-text-muted`)
- [x] 2.3 `TopNav.tsx`: Replace `text-red-600 hover:bg-red-50` on sign-out button with `text-brand-error hover:bg-brand-error/10`

## 3. Token Normalization — Admin Pages

- [x] 3.1 `admin/page.tsx`: Replace all `slate-*`, `amber-*`, `blue-*`, `indigo-*`, `emerald-*` utilities with `brand-*` tokens
- [x] 3.2 `admin/page.tsx`: Replace `rounded-2xl` on all four stat card icon containers with `rounded-lg`
- [x] 3.3 `admin/content/page.tsx`: Replace all `slate-*` utilities with `brand-*` tokens; fix `rounded-xl` on search input to `rounded-lg`
- [x] 3.4 `admin/sync/page.tsx`: Replace `bg-green-50 border-green-200 text-green-700` / `bg-red-50 border-red-200 text-red-700` result states with `brand-success` / `brand-error` token classes
- [x] 3.5 `admin/(admin-only)/users/page.tsx`: Replace `amber-*`, `emerald-*`, `purple-*`, `red-*`, `slate-*` utilities with `brand-*` tokens including new `brand-admin-*` for the ADMIN badge
- [x] 3.6 `billing/BillingClient.tsx`: Replace `emerald-*` and `slate-*` utilities with `brand-*` tokens

## 4. Fix Fake Data — Admin Overview

- [x] 4.1 Update `getStats()` in `admin/page.tsx` to compute real "활동率": `prisma.user.count` with `skillExecution` in last 30 days divided by total user count
- [x] 4.2 Update `getStats()` to compute real "成功率": success `skillExecution` count divided by total `skillExecution` count, formatted to one decimal place
- [x] 4.3 Replace the chart placeholder div in `admin/page.tsx` with an empty state component: icon + "暂无增长数据" heading + "连接 GA4 后查看平台增长趋势" description + "前往设置" link button

## 5. Accessibility Fixes

- [x] 5.1 `admin/content/page.tsx`: Add `aria-label="搜索文章或 Slug"` to the search input
- [x] 5.2 `admin/(admin-only)/users/page.tsx`: Add `aria-label="搜索用户名或邮箱"` to the search input
- [x] 5.3 `admin/(admin-only)/users/page.tsx`: Replace `title="查看记录并撤销"` with `aria-label="查看积分记录"` on the history icon button
- [x] 5.4 `admin/(admin-only)/users/page.tsx`: Add `aria-label="关闭积分记录"` to the XCircle close button in the transaction history panel
- [x] 5.5 `admin/(admin-only)/users/page.tsx`: Replace native `<img>` with `next/image` `<Image>` for user avatars (`width={48} height={48}`)
- [x] 5.6 `admin/content/page.tsx` + `admin/(admin-only)/users/page.tsx`: Add `scope="col"` to all `<th>` elements
- [x] 5.7 `TopNav.tsx`: Add `aria-current="page"` to active nav links (when `isActive` is true)
- [x] 5.8 `TopNav.tsx`: Add `keydown` Escape listener to close site-switcher and user-menu dropdowns; return focus to trigger button on close

## 6. Mobile Navigation — Hamburger Drawer

- [x] 6.1 `TopNav.tsx`: Add `isMobileMenuOpen` state and a `Menu` / `X` hamburger button visible only at `< md`
- [x] 6.2 `TopNav.tsx`: Implement slide-in drawer panel containing all `NAV_LINKS` and `adminLinks` (same filtering logic as existing desktop admin links)
- [x] 6.3 `TopNav.tsx`: Add backdrop overlay behind drawer; clicking it closes the drawer
- [x] 6.4 `TopNav.tsx`: Add Escape key listener to close the drawer and return focus to the hamburger button
- [x] 6.5 `TopNav.tsx`: Close drawer automatically when a nav link inside it is clicked
- [x] 6.6 Add drawer nav link strings to the `COPY` constant for i18n readiness

## 7. Touch-Accessible User Table Actions

- [x] 7.1 `admin/(admin-only)/users/page.tsx`: Remove `opacity-0 group-hover:opacity-100` from the action column; replace with a `MoreVertical` kebab button that is always visible
- [x] 7.2 `admin/(admin-only)/users/page.tsx`: Implement a small dropdown from the kebab button with "调整积分" and "代理登录" options
- [x] 7.3 `admin/(admin-only)/users/page.tsx`: "调整积分" option reveals the number input + `+`/`-` controls inline for that row
- [x] 7.4 `admin/(admin-only)/users/page.tsx`: Add `aria-label` to the `+` and `-` credit buttons in the format "增加积分 for {user.name}"

## 8. Sync Page & Billing Polish

- [x] 8.1 `admin/sync/page.tsx`: Replace `<span className="animate-spin">🔄</span>` with `<Loader2 size={20} className="animate-spin" />`
- [x] 8.2 `admin/sync/page.tsx`: Replace `container mx-auto py-20 max-w-2xl` wrapper with standard `space-y-8` layout + `h1` page header matching other admin pages
- [x] 8.3 `billing/BillingClient.tsx`: Remove `scale-105 z-10` from recommended card; replace with `ring-2 ring-brand-secondary shadow-lg`

## 9. Final Gate

- [x] 9.1 Run `/audit admin dashboard` and verify score reaches 14+/20
- [x] 9.2 Run `/polish admin dashboard` to catch any remaining micro-detail issues
- [x] 9.3 Run `/web-design-guidelines` on all modified files and fix reported issues
