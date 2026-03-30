## ADDED Requirements

### Requirement: Read-only API routes return HTTP cache headers
All read-only dashboard API routes SHALL return `Cache-Control: private, max-age=N, stale-while-revalidate=M` headers to enable browser-level caching. The `private` directive ensures user-specific data is never cached by shared proxies or CDNs.

#### Scenario: Audit history route returns cache header
- **WHEN** a GET request is made to `/api/dashboard/sites/[siteId]/audits`
- **THEN** the response SHALL include `Cache-Control: private, max-age=60, stale-while-revalidate=120`

#### Scenario: Competitors route returns cache header
- **WHEN** a GET request is made to `/api/dashboard/sites/[siteId]/competitors`
- **THEN** the response SHALL include `Cache-Control: private, max-age=120, stale-while-revalidate=240`

#### Scenario: Semantic gap route returns cache header
- **WHEN** a GET request is made to `/api/dashboard/sites/[siteId]/semantic-gap`
- **THEN** the response SHALL include `Cache-Control: private, max-age=300, stale-while-revalidate=600`

#### Scenario: Strategy route returns cache header
- **WHEN** a GET request is made to `/api/dashboard/sites/[siteId]/strategy`
- **THEN** the response SHALL include `Cache-Control: private, max-age=60, stale-while-revalidate=120`

#### Scenario: Tab switch uses browser-cached response
- **WHEN** a user switches away from a dashboard tab and returns within the max-age window
- **THEN** the browser SHALL serve the cached API response without making a new network request
