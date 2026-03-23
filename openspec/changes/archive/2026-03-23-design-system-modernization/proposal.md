## Why

The current Neo-Brutalism design (electric lime #00ff88, hot coral #ff006e, zero border-radius) creates a visual identity that feels mismatched for a professional SEO/SEM SaaS — users perceive the product as less trustworthy and less polished than competitors like Ahrefs or Notion. Additionally, the electric lime fails WCAG AA contrast requirements (1.8:1 on white) and is semantically overloaded as both a brand accent and a success state color, breaking UI clarity.

ScaletoTop's long-term positioning is to serve any team — globally — that needs efficient, trackable SEO and SEM tooling: from beginners to expert practitioners, from Chinese overseas businesses to international growth teams. The design system must be culturally neutral and globally scalable, not optimized for a single market. The homepage Phase 1 targets the current ICP (Chinese overseas businesses starting their SEO journey) as a go-to-market beachhead, but the underlying design language must not be market-specific.

## What Changes

- **Color system**: Replace electric lime (#00ff88) as UI accent with sky blue (#00d4ff); replace hot coral (#ff006e) with amber (#f59e0b); decouple success color from brand accent; retain Logo gradient (green→cyan) on logo mark only
- **Border-radius**: Unify to `rounded-lg` (8px) across all components — eliminate the current mismatch between global `--radius: 0` and per-component rounded-xl/2xl overrides
- **Typography**: Replace Syne (no CJK glyphs) with Plus Jakarta Sans for display headings; add proper `Noto Sans SC` fallback to all font stacks for bilingual readiness
- **Design tokens**: Rewrite all CSS custom properties in `globals.css` and `tailwind.config.ts` to reflect the new system
- **Homepage redesign**: Restructure for beginner SEO acquisition — cleaner hierarchy, benefit-led copy, Notion-style whitespace, Ahrefs-style data credibility signals
- **Tools page redesign**: Beginner-friendly layout with clear tool descriptions and use-case framing
- **Core components**: Update Button, Card, and MainLayout to use new tokens and rounded-lg strategy
- **Brand voice rules**: Document 精准·实用·有底气 guidelines in `rules/design.md` so AI-generated copy is consistent
- **i18n preparation**: Remove all hardcoded text strings from redesigned components; use i18n-ready prop patterns so `/zh/` and `/en/` subdirectory routing can be added later without component refactoring

## Capabilities

### New Capabilities

- `design-system-tokens`: New unified design token system — color palette, typography scale, border-radius, spacing — replacing the Neo-Brutalism token set
- `homepage-acquisition`: Redesigned homepage optimized for converting beginner SEO users — Phase 1 copy targets Chinese overseas businesses as the current ICP beachhead, but layout and components are globally reusable
- `tools-page-layout`: Redesigned tools page with beginner-friendly structure and clear tool descriptions

### Modified Capabilities

- `unified-navigation`: MainLayout header/footer updated to use new design tokens and rounded-lg strategy; navigation items must be i18n-ready (no hardcoded strings)

## Impact

**Files changed:**
- `src/app/globals.css` — full rewrite of CSS custom properties
- `tailwind.config.ts` — theme token updates
- `rules/design.md` — replace placeholder TODOs with actual spec values
- `src/app/(public)/page.tsx` — homepage redesign
- `src/app/(public)/tools/page.tsx` — tools page redesign
- `src/components/ui/Button.tsx` — variant updates for new color system
- `src/components/ui/Card.tsx` — fix border-radius to rounded-lg
- `src/components/layout/MainLayout.tsx` — header/footer token and i18n-readiness updates

**Dependencies added:**
- Google Fonts: Plus Jakarta Sans (replaces Syne)
- No new npm packages required

**Breaking changes:**
- **BREAKING**: Any component relying on `.border-brutalist`, `.brutalist-hover`, or the `--secondary: #00ff88` token will visually change. Phase 2 full-site rollout will address remaining components.

**Not in scope (Phase 2):**
- Full site component rollout beyond homepage, tools, Button, Card, MainLayout
- `next-intl` i18n implementation (design prep only in this phase)
- Dark mode activation
