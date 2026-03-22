## MODIFIED Requirements

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
