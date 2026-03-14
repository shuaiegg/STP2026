## ADDED Requirements

### Requirement: ADMIN role is exempt from credit deduction
The `chargeUser()` function in `src/lib/billing/credits.ts` SHALL check the user's role before deducting credits. If the user's role is `ADMIN`, the function SHALL return a successful result without deducting any credits and without creating a `CreditTransaction` record.

#### Scenario: ADMIN executes AI skill with no credit deduction
- **WHEN** `chargeUser()` is called with a userId whose role is `ADMIN`
- **THEN** the function SHALL return `{ success: true, remainingCredits: user.credits }`
- **THEN** NO credits SHALL be deducted from the user's balance
- **THEN** NO `CreditTransaction` record SHALL be created

#### Scenario: USER role still deducts credits normally
- **WHEN** `chargeUser()` is called with a userId whose role is `USER`
- **THEN** the function SHALL proceed with the normal credit deduction transaction
- **THEN** credits SHALL be deducted and a `CreditTransaction` record SHALL be created

#### Scenario: EDITOR role still deducts credits normally
- **WHEN** `chargeUser()` is called with a userId whose role is `EDITOR`
- **THEN** the function SHALL proceed with the normal credit deduction transaction

### Requirement: ADMIN credit exemption does not pollute usage statistics
ADMIN credit usage SHALL NOT appear in credit consumption statistics or `CreditTransaction` records, so that user consumption analytics remain accurate.

#### Scenario: ADMIN activity absent from CreditTransaction table
- **WHEN** an ADMIN executes any number of AI skill calls
- **THEN** NO `CreditTransaction` records with `type: CONSUMPTION` SHALL be created for that ADMIN user
- **THEN** aggregated user consumption statistics SHALL not include ADMIN activity

### Requirement: ADMIN credits balance remains unchanged after AI tool use
Since ADMIN users are exempt, their `User.credits` balance SHALL remain at its current value after any AI tool execution.

#### Scenario: ADMIN credits unchanged after geo-writer generation
- **WHEN** an ADMIN completes a full geo-writer generation (audit + full)
- **THEN** the ADMIN's `User.credits` value SHALL be unchanged before and after the operation
