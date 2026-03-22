## ADDED Requirements

### Requirement: Credit balance display
The billing page SHALL display the authenticated user's current credit balance prominently.

#### Scenario: Balance shown on page load
- **WHEN** a user visits `/dashboard/billing`
- **THEN** their current credit balance is displayed with a credit icon

### Requirement: Credit package cards
The billing page SHALL display three credit package cards with purchase CTAs, loaded from the products configuration.

#### Scenario: All three packages displayed
- **WHEN** the billing page renders
- **THEN** three package cards show: 入门包 (50 credits/$9), 标准包 (130 credits/$19, recommended), 专业包 (300 credits/$39)

#### Scenario: Package card content
- **WHEN** viewing a package card
- **THEN** it displays credit amount, price, per-credit unit price, savings percentage vs starter pack, and a purchase button

#### Scenario: Recommended package highlighted
- **WHEN** viewing the 标准包 (130 credits)
- **THEN** it has a visual "推荐" badge distinguishing it from other packages

#### Scenario: Purchase button initiates checkout
- **WHEN** user clicks the purchase button on a package card
- **THEN** the frontend calls `POST /api/billing/checkout` with the package's `productId` and redirects to the returned `checkoutUrl`

#### Scenario: Purchase button shows loading state
- **WHEN** the checkout API call is in progress
- **THEN** the button shows a loading indicator and is disabled to prevent double submission

### Requirement: Post-payment success feedback
The billing page SHALL display a success message when the user returns from Creem checkout.

#### Scenario: Success URL parameter triggers toast
- **WHEN** user lands on `/dashboard/billing?success=1`
- **THEN** a success notification is displayed indicating credits will be available shortly

### Requirement: Credit transaction history
The billing page SHALL display the 10 most recent CreditTransaction records for the user.

#### Scenario: Transaction history displayed
- **WHEN** the user has completed transactions
- **THEN** up to 10 recent transactions are listed with date, type, amount, and description

#### Scenario: Empty state for new users
- **WHEN** a new user with only the registration bonus visits the billing page
- **THEN** the registration bonus transaction is visible in the history

#### Scenario: Transaction type labeling
- **WHEN** transactions are displayed
- **THEN** PURCHASE shows as "购买", CONSUMPTION shows as "使用", BONUS shows as "赠送", REFUND shows as "退款"

## MODIFIED Requirements (creem-launch-compliance)

### Requirement: Pricing page synced with actual billing system
The `/pricing` page SHALL display credit packages that exactly match the `CREDIT_PRODUCTS` configuration, with purchase CTAs directing to `/dashboard/billing`.

#### Scenario: Pricing matches billing system
- **WHEN** a visitor views `/pricing`
- **THEN** the displayed packages are 50 credits/$9, 130 credits/$19, and 300 credits/$39 — exactly matching `CREDIT_PRODUCTS`

#### Scenario: Old packages removed
- **WHEN** viewing `/pricing`
- **THEN** no packages showing "100 credits/$9.9" or "350 credits/$29" are displayed

#### Scenario: Purchase CTA links to billing page
- **WHEN** a visitor clicks a purchase button on the pricing page
- **THEN** they are directed to `/dashboard/billing` (authenticated) or `/register` (unauthenticated)

#### Scenario: Pricing data from single source
- **WHEN** `CREDIT_PRODUCTS` in `src/lib/billing/products.ts` is updated
- **THEN** the pricing page reflects the new values without requiring separate edits
