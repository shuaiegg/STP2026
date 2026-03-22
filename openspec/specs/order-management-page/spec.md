## ADDED Requirements

### Requirement: Admin order management page
The system SHALL provide an admin-only page at `/dashboard/admin/orders` listing all PURCHASE credit transactions with their associated Creem checkout IDs.

#### Scenario: Admin-only access
- **WHEN** a non-admin user accesses `/dashboard/admin/orders`
- **THEN** they receive a 403 / redirect

#### Scenario: Order list displayed
- **WHEN** an admin views the orders page
- **THEN** a paginated list of all PURCHASE transactions is shown, newest first, with: user email, credits purchased, Creem checkout ID (externalId), amount paid (inferred from credits), created date

#### Scenario: Filter by user email
- **WHEN** an admin enters a user email in the filter field
- **THEN** the list narrows to only that user's PURCHASE transactions

#### Scenario: Checkout ID copy
- **WHEN** an admin clicks the copy icon next to a checkout ID
- **THEN** the checkout ID (`ch_xxx`) is copied to clipboard for use in Creem Dashboard

#### Scenario: Refund status indicator
- **WHEN** a PURCHASE transaction has a corresponding REFUND transaction (matched by externalId containing the checkout ID)
- **THEN** the order row shows a "已退款" badge

#### Scenario: Historical orders without checkout ID
- **WHEN** a PURCHASE transaction has no externalId (pre-migration data)
- **THEN** the checkout ID column displays "历史订单" instead of an ID
