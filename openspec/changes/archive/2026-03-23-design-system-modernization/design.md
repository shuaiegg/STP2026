## Context

ScaletoTop is a Next.js 16 App Router SaaS. The long-term product vision is to serve any team — globally — that needs efficient, trackable SEO and SEM tooling: beginners to experts, Chinese overseas businesses to international growth teams. The current go-to-market ICP is Chinese overseas businesses beginning their SEO journey, which informs Phase 1 homepage copy but must not constrain the design system itself.

The design system must be **culturally neutral and globally scalable** — sky blue and amber are chosen specifically because they carry no market-specific connotations. The typography stack (Plus Jakarta Sans + Noto Sans SC) handles Latin and CJK scripts equally. The token architecture supports future market-specific theming without structural changes.

The product serves two user segments: SEO beginners (primary acquisition target on public pages) and advanced SEO/SEM professionals (power users in dashboard/tools). The homepage must convert beginners; the dashboard must satisfy experts. These require different visual registers — accessible and inviting for the former, data-dense and credible for the latter.

Current constraints:
- Tailwind CSS v4 (PostCSS plugin, `@import "tailwindcss"`, `@theme inline` blocks)
- Google Fonts loaded via `<link>` in `src/app/layout.tsx`
- All brand tokens defined as CSS custom properties first, then mapped to Tailwind via `@theme inline`
- `@tailwindcss/typography` plugin active for prose content
- Dark mode variables exist but are commented out — not activating in this phase

## Goals / Non-Goals

**Goals:**
- Replace Neo-Brutalism token set with a professional modern SaaS palette
- Unify border-radius to `rounded-lg` (8px) across all components
- Fix WCAG AA contrast failures on current accent colors
- Replace Syne font (no CJK) with Plus Jakarta Sans; add Noto Sans SC to all font stacks
- Redesign homepage for beginner SEO user acquisition
- Redesign tools page for beginner-friendly tool discovery
- Document brand voice and design rules in `rules/design.md`
- Make redesigned components i18n-ready (no hardcoded strings)

**Non-Goals:**
- Full site component rollout (Phase 2)
- Dark mode activation
- `next-intl` implementation
- Dashboard or admin UI changes
- New features or functionality

## Decisions

### D1: Sky Blue (#00d4ff) as primary UI accent, not a new brand color

**Decision**: Use `#00d4ff` (extracted from the existing logo gradient) as the primary interactive accent (links, focus rings, primary buttons). Do not introduce an entirely new color.

**Rationale**: The logo gradient runs `#00ff88 → #00d4ff`. The user is satisfied with the logo. Using `#00d4ff` as the UI accent creates visual coherence between logo and product without requiring a brand identity reset. It passes WCAG AA (5.1:1 on white) unlike the current `#00ff88` (1.8:1).

**Alternative considered**: `#0ea5e9` (Tailwind sky-500) — more neutral, but breaks the logo relationship. Rejected.

### D2: Amber (#f59e0b) replaces hot coral (#ff006e) as secondary accent

**Decision**: Use `#f59e0b` (amber) for secondary emphasis, warnings, and value signals.

**Rationale**: Amber communicates "value", "caution", and "attention" — semantically appropriate for a growth/SEO tool. Hot coral (`#ff006e`) reads as "error" or "delete" to most users, conflicting with its current use as a general accent. Amber is also culturally neutral across Chinese and Western markets.

**Alternative considered**: Keeping coral for a bolder look — rejected because it undermines the trust signals needed for B2B conversion.

### D3: Unified `rounded-lg` (8px) strategy — selective rounding, not Brutalism

**Decision**: Set `--radius: 0.5rem` (8px) globally. All interactive components (buttons, cards, inputs, badges) use `rounded-lg`. Modals/dialogs use `rounded-xl`. No component uses `rounded-0` except decorative dividers.

**Rationale**: The current system declares `--radius: 0` (Brutalism) but every major component overrides it inconsistently. Choosing a single value eliminates the mismatch. `rounded-lg` matches the Notion/Ahrefs aesthetic the user referenced — professional but approachable.

**Alternative considered**: Full Brutalism (enforce `rounded-0` everywhere) — rejected because user explicitly chose "modern SaaS" direction.

### D4: Plus Jakarta Sans for display headings

**Decision**: Replace Syne with Plus Jakarta Sans for `--font-display`.

**Rationale**: Plus Jakarta Sans has a wide character set, pairs well with Noto Sans SC (similar x-height and stroke weight), and is available on Google Fonts. Syne has no CJK coverage — in bilingual contexts, heading text falls back to Noto Sans SC with mismatched visual weight, breaking heading hierarchy.

**Font stack**: `'Plus Jakarta Sans', 'Noto Sans SC', sans-serif`

**Alternative considered**: Inter — too neutral, lacks the slight personality needed for marketing headlines. DM Sans — good but slightly lighter weight than desired for data-heavy sections.

### D5: Token migration strategy — in-place replacement, not new namespace

**Decision**: Rewrite existing `--color-brand-*` tokens in place. Do not introduce a new namespace.

**Rationale**: Existing components reference `var(--color-brand-secondary)`, `var(--color-brand-accent)` etc. Rewriting the values (not the names) means all existing components inherit the new colors automatically without a find-and-replace across the codebase. This is the minimal-disruption approach for Phase 1.

**Risk**: Phase 2 components will also change appearance when the full site inherits these tokens. This is intentional — the token rewrite is the foundation for Phase 2.

### D6: i18n preparation via prop-driven text, not yet next-intl

**Decision**: In redesigned components, accept text content as props (or children) rather than hardcoding strings. Do not install `next-intl` in this phase.

**Rationale**: Installing `next-intl` requires routing changes (`/zh/[...slug]` restructure), middleware updates, and message file creation — a separate workstream with SEO implications. For now, removing hardcoded strings from new components ensures zero refactoring cost when i18n is implemented.

**Pattern**: Components receive `title`, `description`, `ctaLabel` etc. as typed props. Parent page files own the strings (easy to replace with `t('key')` calls later).

## Risks / Trade-offs

**[Risk] Phase 2 components change appearance without explicit work**
→ Mitigation: Token rewrite is intentional. Document in commit message that all `--color-brand-secondary` usages will shift to sky blue. Review dashboard pages before deploying to production.

**[Risk] Plus Jakarta Sans loading adds a network request**
→ Mitigation: Both fonts (Plus Jakarta Sans + Noto Sans SC) loaded in a single `<link>` via Google Fonts with `display=swap`. Existing layout already loads 3 font families — adding one, removing one is net neutral.

**[Risk] Sky blue (#00d4ff) may feel too "tech/cold" for Chinese market copy**
→ Mitigation: Amber accent (#f59e0b) provides warmth. Sky blue is used for interactive elements (buttons, links, focus), not decorative color. The combination is neutral across markets.

**[Risk] Homepage redesign is high-effort and subjective**
→ Mitigation: Scope is limited to layout restructure + token application + copy hierarchy. Component logic is unchanged. If the visual result is unsatisfactory after review, individual sections can be iterated without touching the token system.

## Migration Plan

1. Update `globals.css` — rewrite `--color-brand-*` tokens and `--radius`
2. Update `tailwind.config.ts` — sync `@theme inline` mappings
3. Update Google Fonts `<link>` in `src/app/layout.tsx` — swap Syne for Plus Jakarta Sans
4. Update `rules/design.md` — replace all TODO placeholders with actual values
5. Update `Button.tsx` and `Card.tsx` — use updated tokens, remove hardcoded brutalist classes
6. Update `MainLayout.tsx` — apply new tokens, make nav items prop-driven
7. Redesign `(public)/page.tsx` — homepage
8. Redesign `(public)/tools/page.tsx` — tools page
9. Visual review in browser — check both pages at mobile and desktop breakpoints
10. Commit with note: "Phase 1 design system — Phase 2 will roll out to remaining components"

**Rollback**: All changes are in CSS tokens and component files. `git revert` is sufficient. No database or API changes.

## Resolved Decisions

- **OQ1 → RESOLVED**: Retain `grid-bg-dense` overlay in the homepage hero. Keep opacity subtle (`opacity-[0.03]`) to preserve the technical character without overwhelming the Notion-style whitespace. Grid texture is a differentiator — it signals "data/precision" without being aggressive.
- **OQ2 → RESOLVED**: Credit cost is **secondary information** on tool cards. Position below the tool description using `text-sm text-muted` styling. The primary hierarchy is: tool name → use-case description → CTA → credit cost.
- **OQ3 → RESOLVED**: Use **"你"** (informal) throughout all public-facing copy. This matches the brand voice of 精准·实用·有底气 — direct and peer-to-peer, not formal/corporate. "您" would undermine the confident, approachable tone. Apply consistently across homepage, tools page, and all marketing copy.
