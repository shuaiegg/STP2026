# Design & Copy Rules

This file defines the visual design system, UI patterns, and copy guidelines for ScaletoTop.
When building or modifying any UI, follow these rules exactly. Do not make arbitrary design choices.

## Design Review

Before shipping any UI change, run `/web-design-guidelines` skill to check compliance with
Vercel's Web Interface Guidelines. Fix all reported issues before marking the task complete.

---

## Color System

### Brand Colors
- **Primary** (UI Accent): `#10b981` (Emerald) — main CTAs, links, active states; hover `#059669`; muted bg `#d1fae5`
- **Secondary** (Accent): `#f59e0b` (Amber) — highlights, badges, progress indicators
- **Success**: `#16a34a`
- **Destructive**: `#ef4444` — delete actions, error states
- **Info**: `#3b82f6` (Blue) — informational states, tooltips
- **Admin**: `#8b5cf6` (Violet) — admin role badges and controls

### Token Reference (CSS variables → Tailwind classes)
| Token | Value | Tailwind class |
|-------|-------|----------------|
| `--color-brand-secondary` | `#10b981` | `brand-secondary` |
| `--color-brand-secondary-hover` | `#059669` | `brand-secondary-hover` |
| `--color-brand-secondary-muted` | `#d1fae5` | `brand-secondary-muted` |
| `--color-brand-accent` | `#f59e0b` | `brand-accent` |
| `--color-brand-info` | `#3b82f6` | `brand-info` |
| `--color-brand-info-hover` | `#2563eb` | `brand-info-hover` |
| `--color-brand-info-muted` | `#eff6ff` | `brand-info-muted` |
| `--color-brand-admin` | `#8b5cf6` | `brand-admin` |
| `--color-brand-admin-muted` | `#f5f3ff` | `brand-admin-muted` |
| `--color-brand-admin-border` | `#ddd6fe` | `brand-admin-border` |

### Logo Gradient
- Applies **only** to the logo mark SVG: `linear-gradient(135deg, #34d399, #38bdf8)`
- Never use this gradient as a background or button color elsewhere

### Neutral Scale (use Tailwind defaults unless overriding)
- Background: `white` / `gray-50`
- Surface (cards, panels): `white` with `border border-gray-200`
- Muted text: `text-gray-500`
- Body text: `text-gray-900`

### Dark Mode
- Support dark mode via Tailwind `dark:` variants on all new components.
- Do not hardcode colors — always use semantic classes.

---

## Typography

- **Font**: Plus Jakarta Sans for headings, with Noto Sans SC as CJK fallback. System font stack for body if not specified.
- **Heading hierarchy**: `text-3xl font-bold` (h1) → `text-2xl font-semibold` (h2) → `text-xl font-semibold` (h3)
- **Body**: `text-base text-gray-700 leading-relaxed`
- **Small / caption**: `text-sm text-gray-500`
- **Do not** use more than 3 font sizes on a single page.

---

## Spacing & Layout

- Use Tailwind spacing scale (`p-4`, `gap-6`, etc.) — do not use arbitrary values like `p-[13px]`.
- Page max-width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section vertical spacing: `py-16` (large), `py-8` (medium), `py-4` (small)
- Card padding: `p-6` standard, `p-4` compact

---

## Components

### General
- **Border-radius**: `rounded-lg` default for interactive elements, inputs, and cards. `rounded-xl` applies to modals-only.

### Buttons
- **Primary**: `bg-primary text-white hover:bg-primary-hover rounded-lg px-4 py-2 font-medium`
- **Secondary**: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2`
- **Destructive**: `bg-red-500 text-white hover:bg-red-600 rounded-lg px-4 py-2`
- Button text: sentence case, max 4 words, action-oriented ("Start free trial", "Save changes")
- Always include `disabled` and `loading` states.

### Cards
- `rounded-lg border border-gray-200 bg-white shadow-sm`
- Hover: `hover:shadow-md transition-shadow`
- Do not stack more than 2 levels of card nesting.

### Forms
- Label above input, never placeholder-as-label.
- Input: `border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent`
- Error message: `text-sm text-red-500 mt-1`
- Required fields: mark with `*` in the label, not via browser default.

### Navigation
- Active nav item: bold + primary color indicator, not just color change alone.
- Mobile nav: must be accessible via keyboard and have a close button.

### Empty States
- Every list/table must have an empty state with: icon + heading + description + CTA.
- Do not show a blank white box.

### Loading States
- Use skeleton loaders (not spinners) for content areas larger than a single button.
- Skeleton: `animate-pulse bg-gray-200 rounded`

---

## Next.js Best Practices

### Server vs Client Components
- Default to **Server Components**. Only add `'use client'` when you need:
  - `useState`, `useEffect`, or other React hooks
  - Browser APIs (`window`, `document`)
  - Event listeners
- Never add `'use client'` to a layout or a component that only renders static content.

### Data Fetching
- Fetch data in Server Components directly via Prisma or server actions — do not create
  API routes just to fetch data for your own pages.
- Use `cache()` from React for request deduplication in Server Components.
- Use `unstable_cache` for cross-request caching with explicit revalidation tags.

### Images
- Always use `next/image` with explicit `width` and `height` (or `fill` + sized container).
- Never use `<img>` tags for content images.
- Set `priority` on above-the-fold hero images.

### Performance
- Dynamic imports (`next/dynamic`) for heavy components not needed on initial render.
- Do not import entire icon libraries — import named icons only.
- Keep Client Component bundles small: no Prisma, no server-only libs in `'use client'` files.

### Metadata
- Every page must export a `generateMetadata` function or a static `metadata` object.
- Include `title`, `description`, and `openGraph` at minimum.

### Error Handling
- Every route segment must have an `error.tsx` boundary.
- Use `notFound()` from `next/navigation` for 404 cases — do not return null or redirect.

---

## Copy Guidelines

### Voice & Tone

**Brand voice in one sentence**: 像一个懂 SEO 数据的专业搭档，直接给你可执行的结论。

**Three keywords**: 精准 · 实用 · 有底气

**Product positioning**: ScaletoTop serves any team that needs efficient, trackable SEO and SEM tooling — from beginners to experts, across markets. Phase 1 homepage copy targets Chinese overseas businesses as the current ICP beachhead; design language and components are globally neutral.

**Pronoun register**: Always use **"你"** (informal) in Chinese copy — never "您". The brand is peer-to-peer, not deferential. (Resolved OQ3: Confirmed "你" register for all public pages).

| Dimension | Do | Don't |
|-----------|-----|-------|
| Tone | State outcomes directly | Use vague marketing superlatives |
| Numbers | Specific metrics ("提升 37%") | Vague promises ("大幅提升") |
| Perspective | User-centric ("你的网站") | Self-promotional ("我们强大的 AI") |
| Mixed language | Keep proper nouns in English (SEO, GEO, SEM) | Mix Chinese and English mid-sentence |
| Depth | Explain the "why", not just the "what" | Stack feature bullet lists |

**Copy example — bad vs good**:
> 🚫 利用我们强大的AI技术，全面提升您网站的SEO表现！
>
> ✓ 分析你的 103 个页面，找出被 AI 搜索引擎忽略的内容缺口。

- Write in the user's language — if the UI is Chinese, copy is Chinese.
- Do not mix Chinese and English within the same sentence.

### Headlines
- Lead with the benefit, not the feature. ("Rank higher" not "AI-powered SEO analysis")
- Max 8 words for section headlines.
- No exclamation marks in headlines.

### CTAs
- Use first-person where possible: "Start my free trial" over "Start your free trial"
- Be specific: "Analyze my site" not "Get started"
- Pair every CTA with a micro-copy line that removes friction (e.g., "No credit card required")

### Error Messages
- Explain what went wrong in plain language.
- Tell the user what to do next.
- Do not expose technical error codes to end users.

### Microcopy
- Form placeholders: show an example, not a label restatement. ("e.g. scaletotop.com")
- Tooltip text: max 15 words.
- Success messages: confirm the action completed + next step if any.

---

## Accessibility

- All interactive elements must be keyboard navigable (Tab + Enter/Space).
- Images must have meaningful `alt` text. Decorative images: `alt=""`.
- Color must not be the only way to convey information (add icons or text labels too).
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text.
- Use semantic HTML: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<section>`.
