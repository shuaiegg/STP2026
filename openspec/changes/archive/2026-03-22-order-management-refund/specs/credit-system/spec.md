## MODIFIED Requirements

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
