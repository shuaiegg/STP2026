## ADDED Requirements

### Requirement: All admin/dashboard components use brand tokens exclusively
Every color utility in admin and dashboard components SHALL reference `brand-*` Tailwind classes (mapped to `--color-brand-*` CSS variables). Direct use of `slate-*`, `gray-*`, `emerald-*`, `amber-*`, `blue-*`, `indigo-*`, `purple-*`, `red-*`, or `green-*` utilities is NOT permitted in JSX/TSX files under `src/app/(protected)/` and `src/components/dashboard/`.

#### Scenario: Token compliance check on DashboardShell
- **WHEN** `DashboardShell.tsx` is rendered
- **THEN** the root wrapper uses `bg-brand-surface` instead of `bg-slate-50`

#### Scenario: Token compliance check on admin stat cards
- **WHEN** the Admin Overview stat cards are rendered
- **THEN** icon containers use `bg-brand-accent-muted text-brand-accent` (amber) and `bg-brand-info-muted text-brand-info` (blue) instead of `bg-amber-50 text-amber-600` and `bg-blue-50 text-blue-600`

#### Scenario: Token compliance check on TopNav
- **WHEN** TopNav renders the divider separator
- **THEN** it uses `bg-brand-border` instead of `bg-gray-200`

#### Scenario: Token compliance check on BillingClient
- **WHEN** the billing page renders feature check icons
- **THEN** check icons use `text-brand-secondary` instead of `text-emerald-500`

### Requirement: Fake metric values replaced with real computed data
The Admin Overview SHALL display real-time computed metrics from the database. No hardcoded percentage strings are permitted in `admin/page.tsx`.

#### Scenario: User activity rate is computed
- **WHEN** the Admin Overview loads
- **THEN** "活跃度" displays the percentage of users with at least one `skillExecution` record in the last 30 days, computed via Prisma

#### Scenario: Tool success rate is computed
- **WHEN** the Admin Overview loads
- **THEN** "成功率" displays `successCount / totalCount * 100` from `skillExecution` records, formatted to one decimal place

#### Scenario: Chart area shows an empty state when GA4 is not connected
- **WHEN** no GA4 data is available for the platform
- **THEN** the chart area renders an empty state with a "连接 GA4" CTA button, not a "加载中" placeholder

### Requirement: All rounded-2xl instances corrected to rounded-lg in admin components
Icon container elements in admin components SHALL use `rounded-lg` (8px). `rounded-2xl` is not in the design system for this context.

#### Scenario: Stat card icon containers use correct border radius
- **WHEN** admin stat card icon containers are rendered
- **THEN** they use `rounded-lg` not `rounded-2xl`

### Requirement: Sync page uses standard dashboard layout and Loader2 spinner
The sync page SHALL match the layout pattern of other admin pages (`space-y-8` with standard `h1` header). The emoji spinner (`🔄`) SHALL be replaced with `<Loader2>`.

#### Scenario: Sync page layout matches dashboard standard
- **WHEN** `/dashboard/admin/sync` is rendered
- **THEN** the page uses `space-y-8` top-level wrapper and a standard `h1` with `text-3xl font-bold font-display text-brand-text-primary`

#### Scenario: Sync loading state uses Lucide icon
- **WHEN** a sync operation is in progress
- **THEN** the loading indicator is `<Loader2 size={20} className="animate-spin" />` not an emoji

### Requirement: Billing recommended card uses ring highlight instead of scale transform
The recommended billing plan card SHALL use `ring-2 ring-brand-secondary shadow-lg` to visually distinguish itself. `scale-105` SHALL NOT be used on pricing cards.

#### Scenario: Recommended card is visually distinct without layout shift
- **WHEN** the billing page renders three product cards
- **THEN** the recommended card has a colored ring border and elevated shadow, with no CSS transform scaling applied
