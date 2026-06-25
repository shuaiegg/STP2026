## ADDED Requirements

### Requirement: Content generation incorporates the site's business DNA
When generating article content for a site that has a business ontology, the system SHALL inject the site's business DNA (core offerings, target audience, positioning/differentiation) into the generation system prompt, so output reflects that specific business rather than generic SEO copy.

#### Scenario: Site with ontology
- **WHEN** content is generated for a site that has a `SiteOntology`
- **THEN** the generation system prompt MUST include the site's core offerings, target audience, and positioning/differentiation, instructing the model to write for that business and audience

#### Scenario: Applies across writing entry points
- **WHEN** content is generated via any writing entry point (Stellar writer skill or the streaming generation route)
- **THEN** the business DNA MUST be present in the composed system prompt for each

### Requirement: Logged-in writing UI supplies the site context
A logged-in writing surface SHALL let the user choose which site the content is for, and SHALL pass that site's id to the generation request so business DNA can be loaded.

#### Scenario: Logged-in user selects a site before generating
- **WHEN** a logged-in user generates content from a writing UI that offers a site selector
- **THEN** the chosen `siteId` MUST be included in the generation request `input`, and the resulting system prompt MUST include that site's business DNA (when present)

#### Scenario: Anonymous or no-site context
- **WHEN** content is generated without any site context (anonymous public tool, or no site selected)
- **THEN** no `siteId` is required, generation MUST succeed, and the business DNA section MUST be omitted

### Requirement: Graceful degradation without ontology
The system SHALL NOT fail or degrade existing behavior when a site has no business ontology.

#### Scenario: Site without ontology
- **WHEN** content is generated for a site that has no `SiteOntology` (or empty fields)
- **THEN** generation MUST succeed and the system prompt MUST omit the business DNA section, falling back to the prior generic behavior

### Requirement: Business DNA must not introduce promotional tone
The injected business DNA SHALL guide perspective and topical relevance without overriding existing objectivity constraints.

#### Scenario: Objectivity preserved
- **WHEN** business DNA is injected into the prompt
- **THEN** the existing banned-words and "no promotional hyperbole" constraints MUST remain in effect, and the DNA section MUST instruct the model to use the DNA for perspective/relevance rather than salesmanship

### Requirement: DNA phrasing matches content locale
The business DNA section SHALL be expressed in the same language as the content being generated.

#### Scenario: Locale-aligned phrasing
- **WHEN** an article is generated in a given locale (zh or en)
- **THEN** the business DNA section in the prompt MUST be phrased in that same locale to avoid mixed-language contamination of the output
