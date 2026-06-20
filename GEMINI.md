# ScaletoTop — Gemini CLI Project Context

## Product

Bilingual SEO/GEO content + site-intelligence SaaS for businesses (English and Chinese-speaking) growing organic visibility. Next.js 16 App Router, React 19, Prisma ORM, self-hosted PostgreSQL, MinIO image storage, better-auth.

## Your Role in This Workflow

You implement tasks from OpenSpec changes. Before writing any code:
1. Read `openspec/changes/<name>/design.md` — especially the **Implementation Notes** section at the bottom
2. Read `openspec/changes/<name>/tasks.md` — work through tasks in order
3. Read `rules/ai-constraints.md` — critical rules that prevent common mistakes

## Critical Constraints

See **`rules/ai-constraints.md`** for the full list. The most important:

- Public page links → `Link` from `@/i18n/navigation`, not `next/link`
- Session reads → `useSessionContext()` only, never `authClient.useSession()`
- Colors → `brand-*` Tailwind classes only, never hardcoded hex or `emerald-*` / `slate-*`
- Images → always `next/image`, never `<img>`
- Chinese copy → `"您"` not `"你"`
- Cache: site add/delete → `revalidateUserSitesCache(userId)`; content publish → `revalidateContentPaths()`
- Destructive DB/git operations → always ask before executing

## Project Structure

- `src/app/[locale]/(public)/` — public bilingual routes (locale-aware)
- `src/app/(protected)/dashboard/` — authenticated dashboard (NOT locale-routed)
- `src/app/(protected)/dashboard/admin/` — admin CMS (ADMIN/EDITOR role)
- `src/app/actions/` — all data mutations as Server Actions
- `src/lib/` — business logic, AI skills, auth, email, storage
- `openspec/` — change management and living specs
