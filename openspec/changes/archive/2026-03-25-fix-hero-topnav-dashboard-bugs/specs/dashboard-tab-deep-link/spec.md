## ADDED Requirements

### Requirement: TopNav site-switcher renders without crash
The `TopNav` component's site-switcher dropdown SHALL open without throwing a JavaScript ReferenceError. The active site MUST be identified using the `currentSiteId` prop.

#### Scenario: Dropdown opens successfully
- **WHEN** the user clicks the ChevronDown button in the TopNav
- **THEN** the site-switcher dropdown renders without a ReferenceError

#### Scenario: Active site is highlighted correctly
- **WHEN** the dropdown is open and `currentSiteId` matches a site in the list
- **THEN** that site's row shows a check icon and bold text
- **THEN** `aria-selected` is `true` for that row

### Requirement: Integration guidance cards navigate to the correct tab
Clicking a `IntegrationGuidanceCard` inside `OverviewPanel` SHALL immediately switch the active tab to the target tab without requiring a page reload or remount.

#### Scenario: GSC card navigates to integrations tab
- **WHEN** the user clicks the "连接 Search Console" guidance card
- **THEN** the active tab switches to "integrations"

#### Scenario: GA4 card navigates to integrations tab
- **WHEN** the user clicks the "连接 Google Analytics" guidance card
- **THEN** the active tab switches to "integrations"

#### Scenario: Content strategy card navigates to strategy tab
- **WHEN** the user clicks the "创建内容策略" guidance card
- **THEN** the active tab switches to "strategy"
