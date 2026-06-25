## ADDED Requirements

### Requirement: Growth Home shows real GSC performance as a chart
The Growth Home SHALL present the site's real GSC performance as a chart (not only bare numbers) once snapshot data is available, using brand design tokens.

#### Scenario: Data available
- **WHEN** a site has populated GSC snapshot data
- **THEN** the Growth Home MUST render a trend chart of trailing-window impressions (and clicks where available) plus a compact top-queries view

#### Scenario: Token compliance
- **WHEN** the Growth Home performance chart and the site-detail performance dashboard render
- **THEN** all colors MUST come from `--color-brand-*` / `brand-*` tokens, with no hardcoded hex or ad-hoc Tailwind palette colors

### Requirement: Growth Home shows a syncing state after GSC connect
While GSC is connected but snapshot data is still backfilling, the Growth Home SHALL show a syncing state rather than zero-value metrics.

#### Scenario: Data backfilling
- **WHEN** GSC is connected, snapshots are still empty, and the property was selected recently
- **THEN** the Growth Home MUST show a syncing state instead of displaying impressions as `0`

#### Scenario: Sync settled with little data
- **WHEN** the sync has settled but the site genuinely has little/no impressions
- **THEN** the Growth Home MUST show an honest empty/low-data message rather than an indefinite syncing spinner

### Requirement: Growth Home reveals a first real ranking insight
Once real GSC data exists, the Growth Home insight SHALL be able to surface a concrete ranking finding so connecting GSC yields a visible payoff.

#### Scenario: First data reveal
- **WHEN** the first batch of GSC snapshot data is available for a site
- **THEN** the insight area MAY surface a real ranking finding (e.g. the keyword closest to the first page), chosen by availability alongside the existing DNA/competitor/gap insights
