## ADDED Requirements

### Requirement: Product configuration as single source of truth
The system SHALL maintain a `src/lib/billing/products.ts` file defining all purchasable credit packages, including `productId`, `credits`, `price`, `label`, and `recommended` fields. This file is the only place product definitions are stored; both the Checkout API and billing page read from it.

#### Scenario: All three packages are defined
- **WHEN** the products module is imported
- **THEN** it exports exactly 3 packages: 50 credits/$9, 130 credits/$19, 300 credits/$39

#### Scenario: Each package has required fields
- **WHEN** a package entry is accessed
- **THEN** it contains `productId`, `credits`, `price`, `label`, and `recommended` fields

### Requirement: Checkout session creation
The system SHALL expose `POST /api/billing/checkout` which creates a Creem.io checkout session and returns a redirect URL.

#### Scenario: Valid product purchase
- **WHEN** an authenticated user sends `{ productId: "prod_2BYGD83gnmk7kRSe06tL97" }` to `POST /api/billing/checkout`
- **THEN** the system calls the Creem API with `{ product_id, metadata: { userId, credits }, success_url }` and returns `{ checkoutUrl }`

#### Scenario: Invalid product ID rejected
- **WHEN** a user sends a `productId` not in the products configuration
- **THEN** the system returns HTTP 400 with `{ error: "Invalid product" }`

#### Scenario: Unauthenticated request rejected
- **WHEN** a request arrives without a valid session
- **THEN** the system returns HTTP 401

#### Scenario: Missing CREEM_API_KEY
- **WHEN** the `CREEM_API_KEY` environment variable is not set
- **THEN** the system returns HTTP 500 with a configuration error message

### Requirement: Webhook credits crediting via metadata
The system SHALL credit users based on `metadata.credits` from the Creem webhook payload, not from amount × conversion rate.

#### Scenario: Successful webhook with metadata credits
- **WHEN** Creem sends a `checkout.completed` event with `metadata.credits = 50`
- **THEN** the user's credits are incremented by 50 and a `PURCHASE` CreditTransaction is recorded

#### Scenario: Missing metadata credits
- **WHEN** the webhook payload has no `metadata.credits` field
- **THEN** the system returns HTTP 400 and logs the checkout ID for debugging

#### Scenario: Webhook uses eventType field
- **WHEN** Creem sends a webhook with `eventType: "checkout.completed"` (not `type`)
- **THEN** the system correctly identifies and processes the checkout completed event

#### Scenario: Invalid webhook signature rejected
- **WHEN** a request arrives at `/api/webhooks/creem` with a mismatched signature
- **THEN** the system returns HTTP 401 and does not modify any user data
