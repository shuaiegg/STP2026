# AI Implementation Constraints

Critical rules for Gemini CLI and Antigravity when implementing code in this project.
**Only add a rule here when a mistake was actually made — not preventively.**

---

## Routing & i18n

- Public page internal links → use `Link` from `@/i18n/navigation` (NOT `next/link`) — preserves locale prefix
- Dashboard links → use `next/link` (dashboard is NOT locale-routed)
- Never auto-redirect by IP or Accept-Language — URL decides language
- Never touch `localeCookie` in `src/i18n/routing.ts` — must stay `false`
- Client components in the root layout (outside `NextIntlClientProvider`) must NOT call `useLocale()` — it 500s on SSR

## Auth & Session

- Never add standalone `authClient.useSession()` calls — always use `useSessionContext()` from `SessionProvider` (adding more causes 429 cascades)
- When a session field changes (e.g. locale switch), force refresh: `authClient.getSession({ query: { disableCookieCache: true } })` then hard-reload
- `cookieCache` is enabled (5 min TTL) — stale data is served without the force refresh

## Caching

- Adding or deleting a Site → must call `revalidateUserSitesCache(userId)` or the sidebar shows stale data
- Publishing content → `revalidateContentPaths()` busts the `public-content` cache tag
- Never remove or skip `unstable_cache` wrappers on `getPublishedContent` / `getPublishedContentBySlug` / `getActiveCategories` — local dev is high-latency without them

## Brand & Design

- Colors: only `brand-*` Tailwind classes or `--color-brand-*` CSS variables — never hardcoded hex, never `emerald-*` / `slate-*` / `blue-50` / etc.
- Logo gradient (`#00ff88 → #00d4ff`) only on the logo mark SVG — never on buttons, backgrounds, or decorative elements
- Cards: `hover:shadow-md transition-shadow` — no pixel-offset box-shadows
- Never use removed classes: `.border-brutalist`, `.brutalist-hover`, `.bg-gradient-brand`, `.text-gradient-brand`
- All interactive elements: `rounded-lg` — modals may use `rounded-xl`

## Next.js Patterns

- Images: always `next/image` — never `<img>` tags
- Components default to Server Components — add `'use client'` only when hooks or browser APIs are needed
- Every new route segment needs an `error.tsx` boundary
- Every new page must export `generateMetadata` or a static `metadata` object

## Copy & Strings

- Chinese copy uses `"您"` not `"你"` — B2B respectful register
- All user-visible strings go in `const COPY = { ... }` or `const ITEMS = [ ... ]` at file scope — no inline hardcoded strings in JSX

## Destructive Operations — Always Ask First

Never execute without explicit user confirmation:
- `npx prisma migrate dev / deploy / db push` — schema changes
- Any SQL with `DROP`, `TRUNCATE`, `DELETE` without `WHERE`
- `git push --force`, `git reset --hard`, `git clean -f`
- `rm -rf` on any directory
- Changes to `vercel.json` or CI/CD configs

---

*Last updated: 2026-06-20. Update this file when a Gemini/Antigravity mistake reveals a missing rule — evidence-based only.*
