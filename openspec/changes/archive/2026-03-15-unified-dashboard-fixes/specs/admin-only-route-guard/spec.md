## ADDED Requirements

### Requirement: /dashboard/admin/users and /dashboard/admin/skills require ADMIN role via server-side check
The routes `/dashboard/admin/users` and `/dashboard/admin/skills` SHALL be protected by a server-side layout that checks `role === 'ADMIN'` before rendering any page content. Non-ADMIN users (including EDITOR) SHALL be redirected to `/dashboard` without seeing any page content.

#### Scenario: ADMIN accesses users page with no flash
- **WHEN** a user with role `ADMIN` navigates to `/dashboard/admin/users`
- **THEN** the page SHALL render immediately with no redirect

#### Scenario: EDITOR is redirected from users page server-side
- **WHEN** a user with role `EDITOR` navigates to `/dashboard/admin/users`
- **THEN** the server SHALL redirect to `/dashboard` before any page content is sent to the client
- **THEN** NO flash of page content SHALL occur

#### Scenario: EDITOR is redirected from skills page server-side
- **WHEN** a user with role `EDITOR` navigates to `/dashboard/admin/skills`
- **THEN** the server SHALL redirect to `/dashboard` before any page content is sent to the client

#### Scenario: USER is redirected from users page server-side
- **WHEN** a user with role `USER` navigates to `/dashboard/admin/users`
- **THEN** the server SHALL redirect to `/dashboard` before any page content is sent to the client

### Requirement: URL paths for users and skills remain unchanged after route restructure
Moving users/skills into an `(admin-only)` route group SHALL NOT change their public URLs. The routes SHALL remain accessible at `/dashboard/admin/users` and `/dashboard/admin/skills`.

#### Scenario: Users page URL unchanged
- **WHEN** a browser navigates to `/dashboard/admin/users`
- **THEN** the URL SHALL remain `/dashboard/admin/users` (route group parentheses do not appear in URL)

#### Scenario: Skills page URL unchanged
- **WHEN** a browser navigates to `/dashboard/admin/skills`
- **THEN** the URL SHALL remain `/dashboard/admin/skills`
