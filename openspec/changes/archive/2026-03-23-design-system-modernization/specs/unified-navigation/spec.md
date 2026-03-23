## MODIFIED Requirements

### Requirement: MainLayout header applies new design tokens
The MainLayout header SHALL use the new design token system: sky blue (`--color-brand-secondary`) for active/hover states, `rounded-lg` for any pill or badge elements, and no brutalist offset shadows.

#### Scenario: Active navigation item uses sky blue
- **WHEN** a user is on a page and views the header navigation
- **THEN** the active nav item SHALL use `--color-brand-secondary` (#00d4ff) as its indicator color
- **THEN** the active state SHALL use both a color change AND a visual indicator (underline or background pill) — not color alone

#### Scenario: Header has no brutalist box-shadow
- **WHEN** the MainLayout header renders
- **THEN** no element in the header SHALL have a box-shadow with pixel offsets (e.g., `6px 6px 0 0`)
- **THEN** the header bottom border SHALL be `border-b border-gray-200` or equivalent subtle separator

### Requirement: Navigation items accept text as props for i18n readiness
Navigation link labels in MainLayout SHALL be passed as configurable props or defined in a navigation config constant — not hardcoded as JSX string literals inside the component.

#### Scenario: Nav labels are defined in config, not inline
- **WHEN** a developer reads `src/components/layout/MainLayout.tsx`
- **THEN** navigation items SHALL be defined as an array (e.g., `const NAV_ITEMS = [{ label: '...', href: '...' }]`)
- **THEN** the JSX SHALL map over this array rather than contain individual hardcoded `<Link>` elements with literal labels

#### Scenario: Navigation config is easily replaceable with i18n calls
- **WHEN** a developer implements `next-intl` in a future phase
- **THEN** replacing `label: '首页'` with `label: t('nav.home')` SHALL be the only required change per nav item

### Requirement: Footer applies new design tokens
The MainLayout footer SHALL use the new design token system with consistent spacing, muted text hierarchy, and no brutalist styles.

#### Scenario: Footer uses muted text hierarchy
- **WHEN** the footer renders
- **THEN** the footer SHALL use `text-sm text-gray-500` for secondary links and copyright
- **THEN** the footer heading/logo area SHALL use `text-gray-900 font-semibold`

#### Scenario: Footer link columns are i18n-ready
- **WHEN** a developer reads the footer implementation
- **THEN** footer link groups SHALL be defined as a config array (e.g., `const FOOTER_LINKS = [{ group: '...', links: [...] }]`)
- **THEN** no hardcoded Chinese or English strings SHALL appear directly in the footer JSX
