## ADDED Requirements

### Requirement: getSiteById result is cached server-side
The system SHALL cache the result of `getSiteById` using Next.js `unstable_cache` with a TTL of 60 seconds, tagged with `site-{siteId}`.

#### Scenario: Repeated calls within TTL return cached result
- **WHEN** `generateMetadata` and the page component both call `getSiteById` with the same `siteId` in a single request cycle
- **THEN** the database SHALL be queried only once and the cached result SHALL be returned for subsequent calls

#### Scenario: Cache invalidated after site update
- **WHEN** a site's data is updated (domain, name, integrations, etc.)
- **THEN** `revalidateTag('site-{siteId}')` SHALL be called, causing the next request to fetch fresh data from the database

### Requirement: getUserData dashboard aggregation is cached server-side
The system SHALL cache the result of the dashboard aggregation query (`getUserData`) using Next.js `unstable_cache` with a TTL of 30 seconds, tagged with `user-{userId}`.

#### Scenario: Dashboard page load uses cached aggregation
- **WHEN** a user navigates to `/dashboard` within 30 seconds of their previous visit
- **THEN** the 8-query aggregation SHALL be served from cache without hitting the database

#### Scenario: Cache invalidated after credits change
- **WHEN** a user's credits balance changes (AI skill execution, payment webhook, refund)
- **THEN** `revalidateTag('user-{userId}')` SHALL be called to ensure the dashboard reflects the updated balance on next load
