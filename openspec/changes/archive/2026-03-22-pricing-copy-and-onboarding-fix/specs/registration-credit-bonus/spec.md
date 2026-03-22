## MODIFIED Requirements

### Requirement: New user registration credit bonus
The system SHALL automatically grant 10 credits to every new user upon successful registration, using better-auth's `databaseHooks.user.create.after` hook.

#### Scenario: Successful registration grants bonus
- **WHEN** a new user registers via email/OTP
- **THEN** their `User.credits` is set to 10 and a `CreditTransaction` with `type=BONUS` and `description="注册赠送"` is created within 1 second of account creation

#### Scenario: Bonus is idempotent
- **WHEN** the `databaseHooks.user.create.after` hook fires for a user who already has a BONUS transaction with `description="注册赠送"`
- **THEN** no additional credits are granted and no duplicate transaction is created

#### Scenario: Registration bonus amount
- **WHEN** checking the granted bonus
- **THEN** the amount is exactly 10 credits, sufficient for two complete site audits (SITE_AUDIT_BASIC cost = 5) or a partial StellarWriter run

### Requirement: Bonus transaction record
The system SHALL record the bonus as a CreditTransaction with `type=BONUS`.

#### Scenario: Transaction type is BONUS
- **WHEN** a new user's bonus is granted
- **THEN** the CreditTransaction record has `type="BONUS"` and `amount=10`

#### Scenario: Bonus visible in billing history
- **WHEN** user views their credit transaction history on the billing page
- **THEN** the registration bonus transaction appears with a Chinese description "注册赠送"
