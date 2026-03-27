## ADDED Requirements

### Requirement: Color tokens use professional SaaS palette
The design token system SHALL define a color palette based on black primary, sky blue accent, and amber secondary — replacing the Neo-Brutalism electric lime and hot coral palette.

#### Scenario: Primary accent token is sky blue
- **WHEN** a developer uses `var(--color-brand-secondary)` or the Tailwind class `text-brand-secondary`
- **THEN** the rendered color SHALL be `#00d4ff` (sky blue)

#### Scenario: Secondary accent token is amber
- **WHEN** a developer uses `var(--color-brand-accent)` or `text-brand-accent`
- **THEN** the rendered color SHALL be `#f59e0b` (amber)

#### Scenario: Success color is independent from brand accent
- **WHEN** a developer uses `var(--color-brand-success)` or `text-brand-success`
- **THEN** the rendered color SHALL be `#16a34a` (green-600) — distinct from `--color-brand-secondary`

#### Scenario: All interactive accent colors pass WCAG AA on white background
- **WHEN** `#00d4ff` is rendered as a background with dark text on white
- **THEN** the contrast ratio SHALL be ≥ 4.5:1 for normal text
- **WHEN** `#f59e0b` is used as a background with dark text
- **THEN** the contrast ratio SHALL be ≥ 4.5:1

### Requirement: Border-radius is unified to rounded-lg (8px)
The CSS variable `--radius` SHALL be set to `0.5rem`. All component-level border-radius overrides SHALL use `rounded-lg` as the default, `rounded-xl` for modals/dialogs only.

#### Scenario: Button uses rounded-lg
- **WHEN** a Button component renders with any variant
- **THEN** it SHALL have `border-radius: 0.5rem` (8px)

#### Scenario: Card uses rounded-lg
- **WHEN** a Card component renders
- **THEN** it SHALL have `border-radius: 0.5rem` — not `rounded-xl`

#### Scenario: Modal/dialog uses rounded-xl
- **WHEN** an AlertDialog or modal overlay renders
- **THEN** it SHALL use `rounded-xl` (0.75rem)

### Requirement: Typography uses Plus Jakarta Sans for display headings
The `--font-display` token SHALL reference `'Plus Jakarta Sans'` as the primary display font with `'Noto Sans SC'` as the CJK fallback.

#### Scenario: Heading font loads Plus Jakarta Sans
- **WHEN** a heading element (h1–h3) renders on any public page
- **THEN** the browser SHALL apply Plus Jakarta Sans if available, falling back to Noto Sans SC

#### Scenario: Plus Jakarta Sans is loaded from Google Fonts
- **WHEN** any public page loads
- **THEN** the document `<head>` SHALL contain a Google Fonts `<link>` that includes `Plus+Jakarta+Sans`
- **THEN** the document `<head>` SHALL NOT contain a `<link>` for `Syne`

### Requirement: Logo gradient is reserved for logo mark only
The gradient `linear-gradient(135deg, #00ff88, #00d4ff)` SHALL only appear on the logo mark element. No other UI element SHALL use this exact gradient.

#### Scenario: CTA buttons do not use logo gradient
- **WHEN** a primary CTA button renders
- **THEN** its background SHALL be `#00d4ff` (solid) or `#0a0a0a` (solid) — not a gradient

#### Scenario: Logo element uses logo gradient
- **WHEN** the MainLayout header renders
- **THEN** the "S" logo mark SHALL have a background using the `#00ff88 → #00d4ff` gradient

### Requirement: brand-info token group defined in globals.css
The design system SHALL include a `brand-info` semantic token group for informational UI states (blue scale). These tokens SHALL be defined as CSS custom properties in `:root` and exposed via `@theme inline`.

Tokens required:
- `--brand-info`: `#3b82f6` (blue-500) — primary info color
- `--brand-info-hover`: `#2563eb` (blue-600)
- `--brand-info-muted`: `#eff6ff` (blue-50) — background/badge

#### Scenario: brand-info tokens available as Tailwind classes
- **WHEN** a component uses `bg-brand-info-muted text-brand-info`
- **THEN** it renders with the correct blue-scale values defined in `@theme inline`

### Requirement: brand-admin token group defined in globals.css
The design system SHALL include a `brand-admin` semantic token group for ADMIN role indicators (purple scale). These tokens SHALL be defined as CSS custom properties in `:root` and exposed via `@theme inline`.

Tokens required:
- `--brand-admin`: `#7c3aed` (violet-600) — admin accent
- `--brand-admin-muted`: `#f5f3ff` (violet-50) — background/badge
- `--brand-admin-border`: `#ede9fe` (violet-100) — border

#### Scenario: brand-admin tokens available as Tailwind classes
- **WHEN** the ADMIN role badge uses `text-brand-admin bg-brand-admin-muted border-brand-admin-border`
- **THEN** it renders with the correct violet-scale values

### Requirement: New tokens documented in rules/design.md
The `brand-info` and `brand-admin` token groups SHALL be added to the Token Reference table in `rules/design.md` with their CSS variable names, hex values, and intended use cases.

#### Scenario: Token reference is up to date
- **WHEN** a developer consults `rules/design.md` for available tokens
- **THEN** `brand-info` and `brand-admin` appear in the Token Reference table with usage guidance
