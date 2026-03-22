## ADDED Requirements

### Requirement: Shared admin auth utility
The system SHALL provide a single shared `checkAdmin()` function in `src/lib/auth-utils.ts` that verifies the current session is authenticated with ADMIN role. All server actions and API routes requiring admin access MUST use this shared function instead of local copies.

#### Scenario: Admin session present
- **WHEN** `checkAdmin()` is called with a valid ADMIN session cookie
- **THEN** it returns the authenticated user object without throwing

#### Scenario: Non-admin session present
- **WHEN** `checkAdmin()` is called with a session belonging to a USER or EDITOR role
- **THEN** it throws an error with message "Unauthorized"

#### Scenario: No session present
- **WHEN** `checkAdmin()` is called with no active session
- **THEN** it throws an error with message "Unauthorized"

### Requirement: CRON endpoint rejects missing secret
The cron verification endpoint (`/api/cron/verify`) SHALL reject requests when the `CRON_SECRET` environment variable is not set, rather than falling back to a hardcoded default string.

#### Scenario: CRON_SECRET not configured
- **WHEN** the `CRON_SECRET` environment variable is absent or empty
- **THEN** the endpoint MUST return HTTP 500 with an error indicating misconfiguration

#### Scenario: CRON_SECRET configured and request matches
- **WHEN** the `CRON_SECRET` environment variable is set and the request Authorization header matches
- **THEN** the endpoint proceeds normally

### Requirement: No unauthenticated compute-triggering endpoints
The system SHALL NOT expose any API routes that trigger AI inference, site crawls, or other compute-intensive operations without first verifying an authenticated session.

#### Scenario: Test routes removed
- **WHEN** a request is made to `/api/test-stellar` or `/api/dashboard/test-intelligence`
- **THEN** the server responds with HTTP 404 (routes no longer exist)

### Requirement: Public blog pages served from cache
Public content pages (homepage, blog listing, blog post, category pages) SHALL be served from the Next.js edge cache after first request and SHALL only revalidate when content changes via explicit `revalidatePath()` calls in the sync flow.

#### Scenario: Repeat visitor after sync
- **WHEN** a sync has completed and called revalidatePath
- **THEN** the first subsequent request regenerates the page; all following requests serve the cached version

#### Scenario: Visitor before any sync-triggered revalidation
- **WHEN** no sync has occurred recently and the page is already cached
- **THEN** the cached page is served without hitting the database
