## ADDED Requirements

### Requirement: Admin credit adjustment page
The system SHALL provide an admin-only page at `/dashboard/admin/credit-refund` that allows administrators to manually add or deduct credits for any user, with a required note field.

#### Scenario: Admin-only access
- **WHEN** a non-admin user attempts to access `/dashboard/admin/credit-refund`
- **THEN** they are redirected or shown an unauthorized error

#### Scenario: Admin searches for user
- **WHEN** an admin enters a user email on the credit adjustment page
- **THEN** the system displays the user's current credit balance

#### Scenario: Admin adds credits (refund)
- **WHEN** an admin submits a positive credit adjustment with type REFUND and a note
- **THEN** the user's credits are incremented and a CreditTransaction with `type=REFUND` is recorded with the admin's note in the description

#### Scenario: Admin deducts credits
- **WHEN** an admin submits a negative credit adjustment with a note
- **THEN** the user's credits are decremented and a CreditTransaction with `type=CONSUMPTION` is recorded

#### Scenario: Note is required
- **WHEN** an admin submits an adjustment without a note
- **THEN** the system returns a validation error and does not process the adjustment

### Requirement: Credit adjustment API
The system SHALL expose `POST /api/admin/credit-adjust` that validates admin role and performs atomic credit adjustment.

#### Scenario: Successful adjustment
- **WHEN** an admin sends `{ userId, amount, type, note }` to `POST /api/admin/credit-adjust`
- **THEN** the system executes a Prisma transaction updating User.credits and creating a CreditTransaction

#### Scenario: Non-admin request rejected
- **WHEN** a non-admin user calls `POST /api/admin/credit-adjust`
- **THEN** the API returns HTTP 403

#### Scenario: Invalid amount rejected
- **WHEN** the amount would make user credits negative (for deductions)
- **THEN** the API returns HTTP 400 with a clear error message
