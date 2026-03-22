## MODIFIED Requirements

### Requirement: Webhook idempotency for checkout.completed
The `checkout.completed` webhook handler SHALL be idempotent — processing the same checkout event twice MUST NOT result in duplicate credit grants.

#### Scenario: First webhook call credits user
- **WHEN** a `checkout.completed` event is received for checkout `ch_xxx` for the first time
- **THEN** the user receives the credits and a PURCHASE CreditTransaction with `externalId = ch_xxx` is created

#### Scenario: Duplicate webhook call is a no-op
- **WHEN** a `checkout.completed` event is received for checkout `ch_xxx` and a PURCHASE CreditTransaction with `externalId = ch_xxx` already exists
- **THEN** the handler returns HTTP 200 without modifying user credits or creating a new transaction

#### Scenario: Idempotency check is pre-transaction
- **WHEN** the idempotency check detects a duplicate
- **THEN** no database writes occur (the check happens before the `$transaction` block)

### Requirement: Credits visible in dashboard header
The authenticated dashboard header SHALL display the current user's credit balance at all times.

#### Scenario: Balance displayed in header
- **WHEN** an authenticated user is on any `/dashboard/*` page
- **THEN** the header shows the user's current credit balance with a coin/lightning icon

#### Scenario: Balance is clickable
- **WHEN** a user clicks the credit balance in the header
- **THEN** they are navigated to `/dashboard/billing`

#### Scenario: Balance reads from session
- **WHEN** the header renders
- **THEN** the credit value comes from `session.user.credits` without an additional API call
