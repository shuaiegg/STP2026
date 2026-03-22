## MODIFIED Requirements

### Requirement: Privacy policy bilingual and comprehensive
The privacy policy page SHALL be rewritten to cover all required sections for an international SaaS + AI service handling payment data, presented in both Chinese (primary) and English (secondary).

#### Scenario: Required sections present
- **WHEN** viewing the privacy policy
- **THEN** the page contains all of: data collection scope, how data is used, third-party processors list (Supabase/PostHog/Resend/AI providers/Creem), user rights (access/deletion/export), data retention periods, cross-border data transfer disclosure, contact information for privacy inquiries

#### Scenario: AI data processing disclosed
- **WHEN** viewing the third-party processors section
- **THEN** the page explicitly states that user inputs are processed by DeepSeek/Gemini/Anthropic APIs and are not used to train those models' general capabilities

#### Scenario: Payment data handling disclosed
- **WHEN** viewing the privacy policy
- **THEN** the page states that payment processing is handled by Creem.io as Merchant of Record and ScaletoTop does not store card data

#### Scenario: English version accessible
- **WHEN** an English-speaking user views the privacy policy
- **THEN** a complete English translation is available on the same page

#### Scenario: Support email for privacy inquiries
- **WHEN** viewing the privacy policy contact section
- **THEN** `support@scaletotop.com` is listed as the privacy inquiry contact (replacing `jack@scaletotop.com`)

### Requirement: Terms of service bilingual and comprehensive
The terms of service page SHALL be rewritten to cover SaaS service terms, AI content disclaimers, credit system rules, refund policy reference, and dispute resolution, in both Chinese and English.

#### Scenario: Required sections present
- **WHEN** viewing the terms of service
- **THEN** the page contains: service description, account requirements, credit system rules, acceptable use policy, AI-generated content disclaimer, refund policy reference (with link to /refund), limitation of liability, governing law, dispute resolution, and termination conditions

#### Scenario: Credit non-transferability stated
- **WHEN** viewing the credits section of terms
- **THEN** the terms state that credits are non-transferable, non-refundable after normal use, and have no cash value

#### Scenario: Acceptable use policy included
- **WHEN** viewing the acceptable use section
- **THEN** the terms prohibit: automated scraping/abuse, generating illegal content, reselling AI outputs without attribution, and impersonation

#### Scenario: English version accessible
- **WHEN** an English-speaking user views the terms
- **THEN** a complete English translation is available on the same page
