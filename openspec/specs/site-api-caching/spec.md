# Spec: Site API Caching

## Purpose

Defines caching behaviour for the site detail API endpoints, ensuring clients always receive current database state without stale data from HTTP caching layers.

## Requirements

### Requirement: Site detail API must not serve stale data
`GET /api/dashboard/sites/[siteId]` SHALL return a `Cache-Control: no-store` response header, ensuring every request reflects the current database state without any caching layer returning stale data.

#### Scenario: OAuth callback followed by immediate data fetch
- **WHEN** a user completes Google OAuth (GSC or GA4) and the browser fetches `/api/dashboard/sites/[siteId]`
- **THEN** the response MUST reflect the newly created connection (non-empty `gscConnections` or `ga4Connections`) without requiring a manual page reload

#### Scenario: Cache-Control header value
- **WHEN** any client sends `GET /api/dashboard/sites/[siteId]`
- **THEN** the response MUST include `Cache-Control: no-store` and MUST NOT include `stale-while-revalidate` or `s-maxage` directives
