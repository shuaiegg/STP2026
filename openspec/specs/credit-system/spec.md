## ADDED Requirements

### Requirement: Tool credit costs configuration
The system SHALL define credit costs for all tools in `prisma/seed-skills.ts` using upsert operations.

#### Scenario: Site audit cost
- **WHEN** `SITE_AUDIT_BASIC` SkillConfig is queried
- **THEN** its `cost` is 5 credits and `isActive` is true

#### Scenario: GEO Writer cost
- **WHEN** `GEO_WRITER_FULL` SkillConfig is queried
- **THEN** its `cost` is 15 credits

#### Scenario: Competitor analysis cost
- **WHEN** `COMPETITOR_ANALYSIS` SkillConfig is queried
- **THEN** its `cost` is 8 credits

### Requirement: Insufficient credits redirect
The system SHALL redirect users to the billing page when they attempt to use a tool without sufficient credits.

#### Scenario: Site audit with insufficient credits
- **WHEN** a user with fewer than 5 credits attempts to start a site audit
- **THEN** the system displays an "积分不足" message and provides a link to `/dashboard/billing`

#### Scenario: Sufficient credits allow tool use
- **WHEN** a user has credits ≥ the tool cost
- **THEN** the tool executes normally and deducts credits via `chargeUser()`

## MODIFIED Requirements (order-management-refund)

### Requirement: CreditTransaction stores external payment ID
The `CreditTransaction` model SHALL include an optional `externalId` field to store the Creem checkout or refund ID for cross-system traceability.

#### Scenario: Checkout ID saved on purchase
- **WHEN** a `checkout.completed` webhook is received from Creem
- **THEN** the created PURCHASE CreditTransaction has `externalId` set to the Creem checkout ID (`ch_xxx`)

#### Scenario: Historical records unaffected
- **WHEN** existing CreditTransactions have no externalId
- **THEN** their `externalId` is null and the system continues to function normally

### Requirement: Automatic credit deduction on Creem refund
The system SHALL handle `refund.created` webhook events by automatically deducting the refunded credits from the user's balance.

#### Scenario: Refund event triggers credit deduction
- **WHEN** Creem sends a `refund.created` webhook with a `checkout_id`
- **THEN** the system finds the matching PURCHASE transaction by `externalId = checkout_id`, deducts the original credit amount from the user, and records a REFUND CreditTransaction

#### Scenario: Duplicate refund protection
- **WHEN** the same `refund.created` event is received more than once (webhook retry)
- **THEN** the second event is a no-op (idempotent check via externalId on REFUND transactions)

#### Scenario: Insufficient credits on refund
- **WHEN** a user has fewer credits than the refund amount (already consumed credits)
- **THEN** the system deducts all remaining credits (floors at 0) and records the actual deducted amount

#### Scenario: Unknown checkout ID
- **WHEN** a `refund.created` event references a checkout_id not found in the database
- **THEN** the system logs a warning and returns HTTP 200 (do not retry)

## MODIFIED Requirements (creem-billing-ux-hardening)

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
