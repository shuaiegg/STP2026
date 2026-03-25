## ADDED Requirements

### Requirement: CSS chunks do not block initial render on public pages
The public-facing pages (/, /blog, /blog/[slug], /pricing, /tools) SHALL load without any render-blocking CSS resources as reported by Lighthouse / PageSpeed Insights.

#### Scenario: No render-blocking flag on homepage
- **WHEN** a Lighthouse audit is run against the production build of `/`
- **THEN** the "Eliminate render-blocking resources" audit passes with 0 blocking resources

#### Scenario: No render-blocking flag on blog index
- **WHEN** a Lighthouse audit is run against `/blog`
- **THEN** no CSS chunks appear in the render-blocking resources list

### Requirement: Critical CSS is inlined for above-the-fold content
The build process SHALL inline the minimal CSS required to render above-the-fold content on public pages, so the first paint does not depend on an external stylesheet download.

#### Scenario: Above-the-fold content renders without external CSS
- **WHEN** the browser loads `/` with CSS disabled after first paint
- **THEN** the hero section layout and typography are visually correct (critical styles are inline)

### Requirement: Critical request chain depth is reduced to 1 hop for CSS
The CSS critical request chain SHALL contain at most 1 CSS resource that depends on the initial HTML response. Chained CSS dependencies (CSS that imports other CSS) SHALL NOT appear in the critical path.

#### Scenario: Single-hop CSS critical path
- **WHEN** the Lighthouse "Avoid chaining critical requests" audit runs against `/`
- **THEN** the critical path delay from CSS is ≤ 200ms

### Requirement: Non-critical CSS loads asynchronously
CSS chunks not required for above-the-fold rendering SHALL be loaded with `media="print" onload` swap pattern or equivalent async mechanism so they do not block FCP.

#### Scenario: Secondary CSS loads after FCP
- **WHEN** a waterfall trace is captured for `/`
- **THEN** non-inlined CSS chunks appear after the First Contentful Paint marker
