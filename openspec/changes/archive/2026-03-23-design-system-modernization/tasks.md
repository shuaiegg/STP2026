## 1. Design Tokens — globals.css & Tailwind Config

- [x] 1.1 Rewrite `--color-brand-secondary` from `#00ff88` to `#00d4ff` (sky blue) in `src/app/globals.css`
- [x] 1.2 Rewrite `--color-brand-accent` from `#ff006e` to `#f59e0b` (amber) in `src/app/globals.css`
- [x] 1.3 Add `--color-brand-success: #16a34a` as a separate token (distinct from `--color-brand-secondary`)
- [x] 1.4 Set `--radius: 0.5rem` (8px) — replacing current `0` value
- [x] 1.5 Update all gradient tokens: keep `--grad-main` for logo use only; remove or rename `--grad-main` references in non-logo utilities
- [x] 1.6 Remove or comment out `.border-brutalist`, `.border-brutalist-sm`, `.border-brutalist-accent`, `.brutalist-hover` utility classes
- [x] 1.7 Verify `@theme inline` block in `globals.css` maps new token values to Tailwind correctly
- [x] 1.8 Confirm `tailwind.config.ts` reflects updated brand color values if any are hardcoded there

## 2. Typography — Font Swap

- [x] 2.1 Update Google Fonts `<link>` in `src/app/layout.tsx`: add `Plus+Jakarta+Sans:wght@400;500;600;700;800`, remove `Syne`
- [x] 2.2 Update `--font-display` in `globals.css` to `'Plus Jakarta Sans', 'Noto Sans SC', sans-serif`
- [x] 2.3 Verify `--font-sans` and `--font-mono` stacks both include `'Noto Sans SC'` fallback
- [x] 2.4 Smoke-test heading rendering in browser — confirm Plus Jakarta Sans loads and CJK text falls back cleanly

## 3. Core Components — Button & Card

- [x] 3.1 Update `src/components/ui/Button.tsx` primary variant: use `--color-brand-secondary` (sky blue) as background
- [x] 3.2 Update Button secondary/outline variant colors to use new token values
- [x] 3.3 Remove any `shadow-[*px_*px_0_0_*]` brutalist shadow from Button variants
- [x] 3.4 Update `src/components/ui/Card.tsx` border-radius from `rounded-xl` to `rounded-lg`
- [x] 3.5 Remove brutalist hover shadow from Card if present; replace with `hover:shadow-md transition-shadow`
- [x] 3.6 Verify Badge component uses new token colors (success badge → `--color-brand-success`)

## 4. Navigation — MainLayout Header & Footer

- [x] 4.1 Refactor nav items in `src/components/layout/MainLayout.tsx` into a `const NAV_ITEMS` config array at file scope
- [x] 4.2 Refactor footer link groups into a `const FOOTER_LINKS` config array at file scope
- [x] 4.3 Update active nav item indicator to use `--color-brand-secondary` (sky blue) with both color + underline/pill indicator
- [x] 4.4 Remove any brutalist box-shadow from header elements
- [x] 4.5 Ensure header/footer use `rounded-lg` for any pill, badge, or button elements
- [x] 4.6 Verify mobile nav is keyboard accessible (Tab + Enter/Space) after changes

## 5. Rules Documentation — rules/design.md

- [x] 5.1 Replace all `<!-- TODO -->` placeholders in `rules/design.md` with actual values from this change
- [x] 5.2 Update Primary color hex to `#00d4ff`, Secondary to `#f59e0b`, Success to `#16a34a`
- [x] 5.3 Update typography section: Plus Jakarta Sans for headings, Noto Sans SC fallback documented
- [x] 5.4 Update border-radius section: `rounded-lg` default, `rounded-xl` modals-only
- [x] 5.5 Fill in Brand Voice section: 精准·实用·有底气, "你" register for public pages, copy examples
- [x] 5.6 Add Open Question resolution from design.md OQ3: confirm "你" vs "您" register

## 6. Homepage Redesign — src/app/(public)/page.tsx

- [x] 6.1 Extract all inline text strings into a `const COPY` object at the top of the file
- [x] 6.2 Rewrite hero section: benefit-led headline (outcome-focused), sub-headline naming target audience, specific CTA label + micro-copy friction reducer
- [x] 6.3 Remove `.border-brutalist`, `.brutalist-hover`, `grid-bg`/`grid-bg-dense` classes from hero and main sections
- [x] 6.4 Apply `py-20` or `py-24` section spacing throughout (Notion-style whitespace)
- [x] 6.5 Update feature/method cards: use `rounded-lg`, new token colors, `hover:shadow-md` instead of brutalist offset
- [x] 6.6 Update credibility/stats section: ensure numbers are `text-4xl font-mono`, labels are `text-sm text-muted`
- [x] 6.7 Update CTA section: solid `--color-brand-secondary` button, no gradient background
- [x] 6.8 Verify homepage renders correctly at mobile (375px) and desktop (1440px) breakpoints

## 7. Tools Page Redesign — src/app/(public)/tools/page.tsx

- [x] 7.1 Extract all tool names, descriptions, and group headings into a `const TOOLS` array at file scope
- [x] 7.2 Add plain-language use-case description to each tool entry (1–2 sentences answering "what can I do with this?")
- [x] 7.3 Group tools under labeled section headings if 5 or more tools exist
- [x] 7.4 Add credit cost display to each tool card (`text-sm text-muted` styling, secondary position)
- [x] 7.5 Apply `rounded-lg` to all tool cards; remove brutalist shadow classes
- [x] 7.6 Update tool CTA buttons to use updated Button component `primary` or `secondary` variant
- [x] 7.7 Verify keyboard navigation works across all tool card CTAs

## 8. Visual Review & Verification

- [x] 8.1 Confirm primary button color uses `#00d4ff` (Sky Blue)
- [x] 8.2 Confirm secondary button color uses `#f59e0b` (Amber)
- [x] 8.3 Confirm global border radius is `8px` (`rounded-lg`)
- [x] 8.4 Verify Plus Jakarta Sans is rendering for headings
- [x] 8.5 Run `npm run lint` — fix any ESLint issues introduced by changes
- [x] 8.6 Run `npm run build` — ensure build succeeds without CSS/Tailwind errors unintended visual regressions from token changes
