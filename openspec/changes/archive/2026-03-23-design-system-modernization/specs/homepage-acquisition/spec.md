## ADDED Requirements

### Requirement: Homepage hero communicates primary benefit for SEO beginners
The homepage hero section SHALL lead with a specific, benefit-driven headline that speaks to Chinese overseas businesses starting their SEO/GEO journey. The headline SHALL NOT use vague marketing superlatives.

#### Scenario: Hero headline is benefit-led, not feature-led
- **WHEN** a visitor lands on the homepage
- **THEN** the hero headline SHALL communicate a concrete outcome (e.g., ranking, visibility, traffic) — not a feature name
- **THEN** the hero sub-headline SHALL clarify who the product is for (e.g., 出海企业, overseas businesses)

#### Scenario: Hero CTA is specific and friction-reducing
- **WHEN** a visitor views the hero CTA
- **THEN** the primary CTA button SHALL describe a specific action (e.g., "分析我的网站", "免费开始")
- **THEN** a micro-copy line SHALL appear below the CTA clarifying no credit card is required or the free tier offer

### Requirement: Homepage uses Notion-style generous whitespace
The homepage layout SHALL use a minimum of `py-20` vertical padding between major sections, with no two dense content areas adjacent without a breathing space section.

#### Scenario: Section spacing is consistent
- **WHEN** the homepage renders on desktop (≥1280px)
- **THEN** each top-level section SHALL have at least `padding-top: 5rem` and `padding-bottom: 5rem`

#### Scenario: No brutalist offset shadows on homepage sections
- **WHEN** the homepage renders any section card or feature block
- **THEN** no element SHALL use `.border-brutalist` or `box-shadow` with pixel offsets (e.g., `6px 6px 0 0`)

### Requirement: Homepage includes data credibility signals in Ahrefs style
The homepage SHALL include at least one section with concrete numbers or metrics that establish product credibility, rendered in a data-forward visual style.

#### Scenario: Credibility section shows specific metrics
- **WHEN** a visitor scrolls to the credibility/social-proof section
- **THEN** the section SHALL display at least 3 specific numeric metrics (e.g., sites analyzed, keywords tracked, users)
- **THEN** numbers SHALL be visually large (≥ `text-4xl`) using `--font-mono` for the numeric values

### Requirement: Homepage text content is i18n-ready
All text strings on the homepage SHALL be passed as props or defined as named constants at the top of the page file — not inline hardcoded JSX strings.

#### Scenario: Homepage text is not hardcoded inline
- **WHEN** a developer reads `src/app/(public)/page.tsx`
- **THEN** user-visible strings SHALL be defined as a `const COPY = {...}` object or equivalent at file scope
- **THEN** JSX elements SHALL reference these constants (e.g., `{COPY.heroHeadline}`) rather than containing literal Chinese or English text inline

### Requirement: Homepage applies new design tokens throughout
All colors, border-radius, and typography on the homepage SHALL use the new design token system from `design-system-tokens`.

#### Scenario: No legacy brutalist utility classes on homepage
- **WHEN** the homepage renders
- **THEN** no element SHALL have className containing `border-brutalist`, `brutalist-hover`, or `grid-bg` in the main content sections
