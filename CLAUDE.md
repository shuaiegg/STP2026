# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScaletoTop is a Next.js 16 (App Router) full-stack platform for businesses (English and Chinese-speaking) that need to efficiently grow organic visibility via SEO and GEO: a **bilingual SEO/GEO content + site-intelligence SaaS**. Content lives in PostgreSQL as the single source of truth (created/edited in the admin backend, source `MANUAL`); it publishes to a public bilingual blog/marketing site. The product also includes a **site-intelligence** suite (audits, competitors, GSC/GA4, strategy board, citation tracking), an **activation coach layer** (guides users to their next best move), a consultation lead-capture system, AI model management, and email/marketing automation. Images are uploaded to self-hosted MinIO via the admin editor.

> **Notion has been fully retired** (change `retire-notion-content-cleanup`). `src/lib/notion/` and the `admin/sync` route no longer exist. Do not reintroduce Notion sync; the DB is the content source of truth. (`@notionhq/client` / `notion-to-md` remain in package.json as dead deps pending cleanup; the `ContentSource.NOTION` enum value is retained only for historical rows.)

**Tech Stack**: Next.js 16, React 19, Prisma ORM, PostgreSQL (self-hosted on VPS at `154.12.243.94:54320`), MinIO (self-hosted S3-compatible storage), better-auth (email OTP + password + Google OAuth), next-intl (bilingual), TailwindCSS, Resend (email), systeme.io (marketing automation), PostHog (analytics), DataForSEO (SERP/keywords)

## Development Commands

```bash
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build (runs next build)
npm run lint             # Run ESLint
npm run test             # Run Vitest tests

# Prisma
npx prisma generate      # Regenerate client after schema changes
npx prisma db push       # Apply schema to dev DB (no migration file)
npx prisma migrate dev   # Create migration file (production)
npx prisma db seed       # Seed database (runs prisma/seed.ts)
```

## Engineering Standards

The project follows strict engineering standards for immutability, component composition, and performance.
- **Rules Directory**: Detailed guidelines are stored in `rules/*.md`.
- **Primary Rules**: `rules/STP_RULES.md` is the source of truth for project standards.
- **Frontend Patterns**: `frontend-patterns.skill` contains React/Next.js best practices.
- **Design & Copy Rules**: `rules/design.md` defines visual design and UI patterns; `rules/voice-en.md` defines English brand voice.
- **Content Scorecard**: `rules/content-scorecard.md` defines the 5-dimension quality evaluation protocol for AI-generated content.

## Frontend Design Checklist — Run Before Marking Any UI Task Complete

When implementing or modifying any page, component, or UI element, verify ALL of the following before marking the task done. Do not skip items silently — if a check fails, fix it first.

### Tokens & Colors
- [ ] All colors use `--color-brand-*` CSS variables or Tailwind `brand-*` classes — no hardcoded hex values in JSX/CSS
- [ ] Primary interactive elements (buttons, links, active states) use `brand-secondary` (`#10b981` emerald — the live UI accent; `#00d4ff` cyan is retired, it survives only as the logo-gradient end color, not as an interactive color)
- [ ] No usage of removed utility classes: `.border-brutalist`, `.border-brutalist-sm`, `.border-brutalist-accent`, `.brutalist-hover`, `.bg-gradient-brand`, `.text-gradient-brand`
- [ ] Logo gradient (`linear-gradient(135deg, #00ff88, #00d4ff)`) appears ONLY on the logo mark — not on buttons, backgrounds, or decorative elements

### Layout & Components
- [ ] All interactive elements use `rounded-lg` (8px) — modals/dialogs may use `rounded-xl`; nothing else uses `rounded-0`
- [ ] Cards use `hover:shadow-md transition-shadow` — not pixel-offset box-shadows
- [ ] Section vertical spacing is `py-16` minimum on public pages (`py-20` or `py-24` preferred)
- [ ] Page max-width is `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` or equivalent

### Typography & Copy
- [ ] Headings use `font-display` (Plus Jakarta Sans / Noto Sans SC fallback)
- [ ] No more than 3 font sizes on a single page
- [ ] All user-visible text strings are extracted to a `const COPY = {...}` or `const ITEMS = [...]` at file scope — no inline hardcoded strings in JSX (i18n readiness)
- [ ] Chinese copy uses "您" not "你" — respectful register for B2B audience
- [ ] Headlines lead with the benefit, not the feature name

### Accessibility
- [ ] All interactive elements are keyboard navigable (Tab + Enter/Space)
- [ ] Images have meaningful `alt` text; decorative images use `alt=""`
- [ ] Color is not the only differentiator — icons or text labels accompany color-only states

### Next.js Best Practices
- [ ] Components default to Server Components — `'use client'` added only when hooks or browser APIs are needed
- [ ] `next/image` used for all content images (not `<img>` tags)
- [ ] Every new route segment has an `error.tsx` boundary
- [ ] Pages export `generateMetadata` or a static `metadata` object

### Final Gate
- [ ] Run `/audit [feature]` — review the scored report (target 14+/20), fix all P0/P1 issues using the recommended commands
- [ ] Run `/polish [feature]` — final detail pass for alignment, spacing, and micro-consistency
- [ ] Run `/web-design-guidelines` on the modified file(s) and fix all reported issues before marking complete

## Destructive Operations — Always Confirm First

Before executing any of the following, **stop and explicitly ask the user for confirmation**. Do not proceed without a clear "yes":

### Database
- `npx prisma migrate dev` or `npx prisma migrate deploy` — alters production schema
- `npx prisma db push` — confirm you are on the correct environment (dev vs prod)
- Any raw SQL with `DROP`, `TRUNCATE`, or `DELETE` without a `WHERE` clause
- `npx prisma db seed` on a non-empty database — may overwrite existing data

### Git
- `git push --force` or `git push --force-with-lease`
- `git reset --hard`
- `git checkout .` or `git restore .` — permanently discards uncommitted changes
- `git clean -f` or `git clean -fd`
- `git branch -D` — deletes a branch

### Files & Storage
- `rm -rf` on any directory
- Bulk deletion of files from MinIO `media` bucket
- Overwriting `.env`, `.env.local`, or any environment config file

### Deployment
- Any change to `vercel.json`, CI/CD pipeline configs, or cron job schedules
- Force-deploying to production outside of the normal build process

**Rule**: If an action cannot be fully undone in under 60 seconds, always ask first.

## Architecture Overview

### Route Structure

The app uses Next.js App Router with route groups:

- **`[locale]/(public)/`** - Public-facing routes (no auth required), locale-prefixed (see i18n section)
  - **English at root** (`/`, `/pricing`), **Chinese at `/zh` prefix** (`/zh`, `/zh/pricing`)
  - `/` - Homepage; `/blog`, `/blog/[slug]`, `/blog/category/[slug]` - Blog
  - `/login`, `/register`, `/forgot-password`, `/reset-password` - User auth
  - `/pricing`, `/tools`, `/tools/geo-writer` - Marketing pages
  - `/consultation` - Public consultation lead-capture form (3-step, service-specific)
  - `/preview/[token]` - Preview unpublished content via token

- **`(protected)/dashboard/`** - Authenticated user routes
  - `/dashboard/site-intelligence` - SEO site analysis (list + `[siteId]` detail)
  - `/dashboard/site-intelligence/instant-audit` - One-shot site audit
  - `/dashboard/library` - User article library with `/edit/[id]`
  - `/dashboard/tools` - AI tools; `/dashboard/billing` - Credits; `/dashboard/settings`
  - `/dashboard/onboarding` - New user onboarding flow (shown after registration)

- **`(protected)/dashboard/admin/`** - CMS admin routes (ADMIN/EDITOR role required; Chinese UI, not localed)
  - `/dashboard/admin/content` (+ `[id]`, `/new`) - Content management (create/edit/publish in-app; no external sync)
  - `(admin-only)/` subgroup (ADMIN role only): `/dashboard/admin/users`, `/skills`, `/models` (AI model mgmt), `/integrations` (Resend/systeme.io/PostHog/API keys), `/consultations` (lead mgmt), `/orders`, `/credit-refund`
  - **Legacy `/admin/*` paths 301-redirect to `/dashboard/admin/*`** via `src/middleware.ts` (`/admin/login`→`/login`, `/admin`→`/dashboard`)
  - **`admin/setup`** - First-run admin setup, stays at root path `/admin/setup` (unprotected, whitelisted in middleware)

- **`api/`** - API routes
  - `api/auth/[...all]` - better-auth handlers
  - `api/dashboard/sites/[siteId]/*` - Site intelligence endpoints (audits, competitors, GSC/GA4, strategy)
  - `api/generate-stream`, `api/generate-enrich` - Streaming AI generation
  - `api/skills/execute`, `api/skills/list` - Skills execution API
  - `api/webhooks/creem` - Creem.io payment webhook
  - `api/cron/verify` - Cron job verification

### Internationalization (i18n)

Bilingual via **next-intl**. English is the root-path locale; Chinese uses the `/zh` prefix. Only `[locale]/(public)/` is locale-routed — `(protected)/dashboard/` and `admin/` are NOT translated (single-locale, Chinese UI).

- **Config**: `src/i18n/routing.ts` (locales `['en','zh']`, defaultLocale `en`, `localePrefix: 'as-needed'`), `request.ts`, `navigation.ts` (locale-aware `Link`/`redirect`/`usePathname`)
- **Copy**: `messages/en.json` + `messages/zh.json` (Git-managed, namespaced per page). Server: `getTranslations()`; Client: `useTranslations()`. No DB-backed copy store.
- **Content locale**: `Content.locale` + `translationGroupId` (optional translation pairing for hreflang). `User.locale` drives email/systeme.io/PostHog. `ConsultationRequest.locale` tags lead language.
- **systeme.io dual-account**: routed by locale — `en` → `SYSTEME_IO_API_KEY_EN` (English account), else `SYSTEME_IO_API_KEY` (Chinese/default). `getApiKey(locale)` in `src/lib/email/systeme.ts` resolves the account; every API fn takes an optional `locale`. Tags are account-scoped. Each account has its **own** trigger→tag-name mapping: zh uses `SYSTEME_TAG_ON_*`, en uses `SYSTEME_TAG_ON_*_EN`. `getTriggerTagName(triggerKey, locale, legacyKey?)` in `config.ts` resolves it — for `en` it reads the `_EN` rule and **falls back to the base rule when unset** (so EN tag names default to identical, diverge only when configured). Both admin cards have a tag-rules panel (English card pulls tags from the EN account). `en` + EN key unconfigured → contact sync skipped (does NOT pollute the Chinese account). Trigger callers (auth/consultation/creem webhook/site save/admin user tools) must pass the user's `User.locale`.
- **Page visibility**: `src/lib/i18n/page-availability.ts` — `PAGE_LOCALES` whitelists locale-restricted pages; nav/footer filter by it, unavailable locale → `notFound()`.

**Hard constraints (violating any caused production 500s or silent bugs — do not regress):**
1. `routing.ts` MUST keep `localeCookie: false` — otherwise next-intl's auto-written `NEXT_LOCALE` cookie suppresses the language-suggestion banner. `NEXT_LOCALE` is written only on manual locale switch.
2. Client components mounted in the **root** layout (outside `NextIntlClientProvider`, e.g. `CookieConsentBanner`) MUST NOT call `useLocale()` — it throws on SSR and 500s the whole site. Pass locale via props from the server.
3. Public content queries MUST pass `locale` explicitly — `getPublishedContent` does NOT default to `zh` (a silent default once leaked Chinese articles onto the English homepage).
4. Use the i18n `Link` from `@/i18n/navigation` for internal public links (preserves locale prefix); `next/link` only for `/dashboard/*` (non-localed).
5. Registration locale detection chain: `NEXT_LOCALE` cookie → referer prefix → `Accept-Language` → `en` fallback.
6. **Never** auto-redirect by IP/Accept-Language — URL decides language; the Accept-Language signal only powers a dismissible suggestion banner.

### Authentication Flow

Uses **better-auth** with session cookies. Login is unified on `/login` (the `/register` route is a thin redirect to it):
1. **Email OTP** or **email + password** (two tabs on the login card). New users sign up via OTP; **only new users** then see an optional, skippable "set a password" step (`setInitialPassword` server action calls `auth.api.setPassword` on the already-authenticated session — no second code). Existing users go straight to the dashboard.
2. **Google OAuth** (`authClient.signIn.social`) — `socialProviders.google` in `src/lib/auth.ts`; callback `/api/auth/callback/google` must be whitelisted in Google Console (distinct from the GSC/GA4 data-auth callback `/api/auth/google-callback`).
3. **Domain passthrough**: the homepage hero captures a domain and carries it through login/OAuth (querystring + `sessionStorage`) into onboarding.
4. **Rate limiting** (`src/lib/auth.ts` `rateLimit`): `max: 100/60s` with a higher `/get-session` rule (1000/60s). Client `useSession` is consolidated into a single subscription via `SessionProvider` (`src/components/providers/SessionProvider.tsx`, `useSessionContext()`); do NOT add standalone `authClient.useSession()` calls (causes 429 cascades).
5. Middleware (`src/middleware.ts`) checks the `better-auth.session_token` cookie; `/admin/*` requires ADMIN/EDITOR; `/(protected)/*` requires any session.
6. **`cookieCache`** is enabled (5min) — when changing a session field (e.g. locale switcher), force a refresh with `authClient.getSession({ query: { disableCookieCache: true } })` then hard-reload, or the server keeps returning stale data.
7. User roles: `ADMIN`, `EDITOR`, `USER`.

### Content Management (DB-native)

Content lives in PostgreSQL `Content` (source `MANUAL`) and is the single source of truth — **there is no external sync**. Create/edit in the admin backend at `/dashboard/admin/content` (+ `/new`, `/[id]`).

- **Editing** (`src/app/actions/content.ts`): `createContent` / `updateContentMetadata` (publish transition sets `visibility: PUBLIC` + `publishedAt`) / `deleteContent` (relation cleanup). Markdown is the body format.
- **Images**: uploaded to MinIO via the editor (`uploadImageFromUrl` / direct upload in `src/lib/storage.ts`), stored in `Media`, linked via `coverImageId` / `ogImageId`.
- **Revalidation**: `revalidateContentPaths()` revalidates `/`, `/zh`, `/blog`, `/zh/blog`, the detail + category paths, `/sitemap.xml`, and busts the `public-content` cache tag (see Caching Strategy).
- **Publishing → flywheel**: on publish, `upsertTrackedArticleFromContent` creates a `TrackedArticle` (status `PENDING`) for GEO citation tracking; the cron at `/api/cron/verify` checks `PENDING`/`CHECKING` rows.

### Activation Coach Layer

**Architecture**: `src/lib/coach/*` + `src/components/coach/GrowthHome.tsx` — an orchestration layer over existing organs (audit/ontology/competitor/gap/strategy-board) that tells the user "what to do next, and why".

- `lifecycle.ts` — `classifyStage` 2D matrix (GSC impressions × maturity): stages `0` / `unmeasured` / `1` / `2` / `2_scale`; thresholds in `STAGE_THRESHOLDS`. `syncSiteStage` writes `Site.onboardingStage` and records `CoachMove` `stage_transition` events.
- `registry.ts` — move definitions with `detect`/`reason`/`humanCTA`/`deepLink` + readiness gating (foundation moves gate growth moves). `buildMoveContext` collects all signals in ONE parallel batch; `computeMoves` is pure (zero DB writes on render). Moves are ephemeral (synthetic id `siteId:type`) and only **lazily persisted** as `CoachMove` rows when the user acts (dismiss/start/complete via `src/app/actions/coach.ts`).
- `home.ts` — `getGrowthHomeData` (cached per-site under tag `coach-home-${siteId}`) returns stage + aha **insight** (DNA + competitor + gap) + top-3 moves + honest momentum Pulse.
- **Cold-start onboarding** (`OnboardingClient.tsx`): streams `audit → DNA → competitor inference → gap` as a "逐条点亮" reveal; on save lands on `/dashboard` (the Growth Home). If DNA extraction fails, degrade to a "site health" framing — never show a wrong business understanding.

### Dashboard Shell & i18n switching

- Sidebar IA: `src/components/dashboard/SidebarNav.tsx` — drawer-style nav whose primary items are the **Diagnose / Produce / Measure** loop (product positioning = information architecture). Mounted via `DashboardShell`.
- Dashboard is NOT locale-routed; UI language follows `User.locale` injected through `NextIntlClientProvider` in `(protected)/layout.tsx`. The sidebar language switcher writes `User.locale` (`authClient.updateUser`), force-refreshes the session cookie cache, then hard-reloads.

### AI Skills System

**Architecture**: `src/lib/skills/` — pluggable AI tool framework with credit metering

- `base-skill.ts` - Abstract base class; all skills extend `BaseSkill`
- `skill-registry.ts` - Singleton registry; use `getSkillRegistry()` to look up skills
- `providers/` - Multi-provider: `claude-provider.ts`, `gemini-provider.ts`, `deepseek-provider.ts`, `vps-provider.ts` (CLIProxy)
- Skills are executed via `api/skills/execute` and logged to `SkillExecution` table
- Each execution deducts credits from `User.credits` and records a `CreditTransaction`
- Admin can configure skills via `SkillConfig` table (cost, active status)

**Server Actions**: `src/app/actions/skills.ts` — execute skills server-side

### AI Model Management

**Architecture**: `src/lib/skills/model-resolver.ts` + `prisma: ModelConfig` + `/admin/models`

**Model resolution priority chain** (4 levels):
1. `ModelConfig[context]` — per-context DB config (e.g., `consultation`, `embedding`)
2. `ModelConfig['skill_default']` — global DB default
3. `DEFAULT_AI_PROVIDER` env var
4. Hardcoded fallback: `vps`

**Key functions** (exported from `src/lib/skills/index.ts`):
- `resolveModelForContext(context)` — returns `{ provider, modelId }`
- `resolveSkillModel(skillId)` — per-skill override, falls back to `skill_default`
- `resolveEmbeddingProvider()` — returns `GeminiEmbeddingProvider` + modelId from `ModelConfig['embedding']`

**Provider API Key storage**:
- Keys stored encrypted (AES-256-GCM via `BETTER_AUTH_SECRET`) in `IntegrationConfig` table as `PROVIDER_KEY_{provider}`
- `getProviderApiKey(provider)` in `src/lib/integrations/config.ts` — DB first, env var fallback
- Providers: `claude` → `ANTHROPIC_API_KEY`, `gemini` → `GOOGLE_API_KEY`, `deepseek` → `DEEPSEEK_API_KEY`
- `VPS_PROXY_KEY` is NEVER stored in DB — env var only (security constraint)

**Gemini Embedding**: `src/lib/skills/providers/gemini-embedding-provider.ts`
- `embedText(text, modelId?)` → `Promise<number[]>` (768-dim, `text-embedding-004`)
- `embedBatch(texts, modelId?)` → `Promise<number[][]>`
- Uses `getProviderApiKey('gemini')` — no hardcoded env var reads

**CLIProxy (VPS Provider)**:
- OpenAI-compatible API, 29 chat/generation models, zero embedding models
- Config: `VPS_PROXY_URL` + `VPS_PROXY_KEY` (env only)
- Admin can fetch model list via `/admin/models` → VPS model list panel

### Site Intelligence System

**Architecture**: `(protected)/dashboard/site-intelligence/` + `api/dashboard/sites/`

- Users register Sites with domain, target markets, seed keywords, business ontology
- **Audits**: On-demand site audits scoring tech, content, and GEO aspects (`SiteAudit`)
- **Competitors**: Auto-suggest and scan competitor domains (`Competitor`)
- **GSC Integration**: OAuth to Google Search Console; syncs keyword performance (`GscConnection`, `SiteKeyword`)
- **GA4 Integration**: OAuth to Google Analytics 4; syncs traffic/performance data (`Ga4Connection`)
- **Strategy Board**: AI-generated content plans with Kanban (`ContentPlan`, `PlannedArticle`)
- **Market/Semantic Gap**: AI analysis of content opportunities vs competitors

### Data Model Key Concepts

**Content Lifecycle**:
- Status: `DRAFT` → `PUBLISHED` → `ARCHIVED` (legacy rows may have `SYNCED`)
- Visibility: `PUBLIC`, `PRIVATE`, `UNLISTED` — publishing sets `PUBLIC` + `publishedAt`
- Source: `MANUAL` (created in admin) — `NOTION` retained only for historical rows
- `locale` + `translationGroupId` pair en/zh versions for hreflang

**Categories**:
- Manually managed in admin; not auto-created
- Each category has CTA configuration for category pages

**Media**:
- Centralized storage for all images (uploaded via the admin editor to MinIO)
- Linked via `coverImageId` in Content and `ogImageId` in SeoMeta

**Preview Tokens**:
- Temporary tokens for sharing unpublished content
- Expires based on `expiresAt` timestamp

**SEO**:
- Separate `SeoMeta` table (1:1 with Content)
- Allows overriding meta title/description independent of content
- Supports custom OG images, canonical URLs, GEO score, schema JSON, and social snippets

**Credits & Transactions**:
- Users have `credits` balance on `User` model
- Every AI skill execution costs credits (`SkillConfig.cost`)
- `CreditTransaction` records every change (PURCHASE, CONSUMPTION, REFUND, BONUS)
- Creem.io webhook at `/api/webhooks/creem` auto-credits on payment

**TrackedArticle**:
- GEO citation tracking: stores optimized content and verifies AI citation status
- Cron job checks citation status and updates `citationSource`

**ModelConfig**:
- Admin-managed per-context model assignments (context is unique key)
- Contexts in use: `skill_default`, `consultation`, `embedding`
- Fields: `context`, `provider`, `modelId`, `label`, `updatedBy`

**IntegrationConfig**:
- Key-value store for integration settings (Resend, systeme.io, provider API keys)
- Sensitive values (API keys) stored AES-256-GCM encrypted, decrypted at read time
- Key naming: `SYSTEME_IO_API_KEY`, `PROVIDER_KEY_claude`, `PROVIDER_KEY_gemini`, `SYSTEME_TAG_ON_*`
- `getIntegrationValue(key)` / `setIntegrationValue(key, value)` in `src/lib/integrations/config.ts`

**ConsultationRequest**:
- Public lead-capture form submissions (3 service types: `ai`, `crawler`, `growth`)
- `description` stores the primary text field per type; `details Json` stores all service-specific fields
- Growth type: `details.competitors` (required), `details.adPlatforms[]`, `details.adStatus`
- Status lifecycle: `PENDING` → `REVIEWED` → `CONTACTED`
- On submit: saves to DB + sends admin notification email + sends user confirmation + adds systeme.io contact

## Important Environment Variables

```bash
# Database (self-hosted PostgreSQL on VPS)
DATABASE_URL=              # Connection pool URL (for runtime) — points to 154.12.243.94:54320
DATABASE_URL_DIRECT=       # Direct connection (for Prisma migrations)
# NOTE: Prisma CLI only reads .env (not .env.local). For migrations, ensure DATABASE_URL_DIRECT is set in .env

# MinIO (self-hosted S3-compatible image storage)
MINIO_ENDPOINT=            # e.g., http://minio:9000 (internal) or https://media.scaletotop.com
MINIO_ACCESS_KEY=          # MinIO access key (not root)
MINIO_SECRET_KEY=          # MinIO secret key
MINIO_BUCKET=              # Bucket name: media
MINIO_PUBLIC_URL=          # Public base URL: https://media.scaletotop.com

# DataForSEO (SERP / keyword data for site intelligence + competitor inference)
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# AI Providers (for Skills system)
ANTHROPIC_API_KEY=        # Claude models
GOOGLE_API_KEY=           # Gemini models
DEEPSEEK_API_KEY=         # DeepSeek models
OPENAI_API_KEY=           # OpenAI models (via ai-sdk)

# Google OAuth (for GSC/GA4 integrations)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Payments
CREEM_API_KEY=            # Creem.io API Key for server-side calls
CREEM_WEBHOOK_SECRET=     # Creem.io webhook signature verification

# better-auth
BETTER_AUTH_SECRET=       # Session signing secret
NEXT_PUBLIC_APP_URL=      # Base URL (e.g., https://scaletotop.com)

# Analytics
NEXT_PUBLIC_GTM_ID=               # Google Tag Manager container ID (production only)
NEXT_PUBLIC_POSTHOG_KEY=          # PostHog project API key
NEXT_PUBLIC_POSTHOG_HOST=         # PostHog host (e.g., https://app.posthog.com)

# Email (Resend)
RESEND_API_KEY=            # Resend API key
EMAIL_FROM=                # Sender address (e.g., ScaletoTop <noreply@mail.scaletotop.com>)
EMAIL_REPLY_TO=            # Reply-to address (e.g., jack@scaletotop.com)
ADMIN_NOTIFICATION_EMAIL=  # Where consultation notifications go (default: jack@scaletotop.com)

# Marketing Automation (systeme.io)
SYSTEME_IO_API_KEY=        # systeme.io API key (also storable in IntegrationConfig DB table)

# AI Providers (also storable encrypted in IntegrationConfig)
VPS_PROXY_URL=             # CLIProxy base URL
VPS_PROXY_KEY=             # CLIProxy auth key — NEVER store in DB, env only
```

## Server Actions Pattern

All data mutations use Next.js Server Actions (`'use server'`):
- `src/app/actions/content.ts` - Content CRUD (create/update/publish/delete)
- `src/app/actions/coach.ts` - Coach move status (dismiss/start/complete)
- `src/app/actions/category.ts` - Category management
- `src/app/actions/auth.ts` - Authentication helpers
- `src/app/actions/skills.ts` - AI skill execution
- `src/app/actions/user.ts` - User profile and credit management
- `src/app/actions/tracked-articles.ts` - GEO citation article tracking
- `src/app/actions/update-article.ts`, `delete-article.ts` - Library article management
- `src/app/actions/consultation.ts` - Public consultation form submission (DB + email + systeme.io)

### Webhooks

- **/api/webhooks/creem** - Receives payment confirmation from Creem.io.
  - Verifies signature using `CREEM_WEBHOOK_SECRET`.
  - Automatically credits user accounts based on `amount_paid`.
  - Records transaction in `CreditTransaction` table.

Pattern: Server Actions return `{ success: boolean, message: string, data?: any }`

## Prisma Usage Notes

1. **Always generate client after schema changes**: `npx prisma generate`
2. **For dev changes**: Use `npx prisma db push` (fast, no migrations)
3. **For production**: Use `npx prisma migrate dev` to create migration files
4. **Prisma version locked**: v5.22.0 for Next.js 16 + Turbopack stability
5. **Engine type**: Using `library` engine type for better compatibility

## Common Development Scenarios

### Adding a New Content Field

1. Update `prisma/schema.prisma` (add field to `Content` model)
2. Run `npx prisma db push` (dev) or `npx prisma migrate dev` (production)
3. Run `npx prisma generate`
4. Update the admin content form (`src/app/(protected)/dashboard/admin/content/`) + `src/app/actions/content.ts`
5. Restart dev server

### Handling Image Storage

Images are stored in self-hosted **MinIO** (S3-compatible), uploaded via the admin editor:

```typescript
import { uploadImageFromUrl } from '@/lib/storage';

const result = await uploadImageFromUrl(imageUrl, {
  filename: 'my-image.png', // optional
});
// Returns: { mediaId, storageUrl, storagePath }
// (options also accepts a legacy `notionBlockId` for historical dedup)
```

**Storage config** (`src/lib/storage.ts` uses `@aws-sdk/client-s3` with `forcePathStyle: true`):
- Bucket: `media` (public read)
- Internal endpoint: `MINIO_ENDPOINT` (e.g. `http://minio:9000`)
- Public URL base: `MINIO_PUBLIC_URL` (e.g. `https://media.scaletotop.com`)
- Note: `media.scaletotop.com` → MinIO S3 port 9000 via Coolify reverse proxy (see technical-backlog.md if 504)

### Email & Marketing Automation

**Email** (`src/lib/email.ts` + `src/lib/email/templates/`):
- Provider: Resend (`RESEND_API_KEY`)
- Templates: `welcome`, `credits-warning`, `purchase-success`, `audit-complete`, `consultation-notification`, `consultation-confirmation`
- All templates are HTML functions, not framework components

**systeme.io** (`src/lib/email/systeme.ts`):
- `addContact(email, name, tags[])` — creates contact then applies tags separately (do NOT pass tags in POST body)
- **Known gotcha**: existing contacts return **422** (not 409) — both are handled as "contact exists, apply tags"
- Tags must exist in systeme.io before use — API does not auto-create tags
- Tag name→ID resolution happens via `getTags()` + `applyTagsToExistingContact()`
- API key: DB (`IntegrationConfig['SYSTEME_IO_API_KEY']`) → env fallback

**Trigger keys** (`src/lib/integrations/systeme-triggers.ts`):
- `SYSTEME_TAG_ON_REGISTER`, `SYSTEME_TAG_ON_ONBOARDING`, `SYSTEME_TAG_ON_PURCHASE`, `SYSTEME_TAG_ON_CREDITS_LOW`, `SYSTEME_TAG_ON_CONSULTATION`
- Each key maps to a tag name stored in `IntegrationConfig` — configured via `/admin/integrations`

### Consultation System

**Public form**: `src/app/(public)/consultation/` (3-step: service type → details → contact)

**3 service types with different Step 2 fields**:
- `ai` — scenario (→ description), tools, painPoints, deliveryType
- `crawler` — dataSources (→ description), dataUse, frequency, deliveryFormat, dataVolume
- `growth` — competitors (→ description, required), website, targetMarket, currentTraffic, mainGoal, adPlatforms[], adStatus

**On submission** (`src/app/actions/consultation.ts`):
1. Save `ConsultationRequest` to DB (description = main text, details = JSON blob)
2. Send admin notification to `ADMIN_NOTIFICATION_EMAIL`
3. Send user confirmation email
4. `addContact()` to systeme.io with `SYSTEME_TAG_ON_CONSULTATION` tag

**PostHog events**: `consultation_service_selected`, `consultation_step2_completed`, `consultation_submitted`

**Admin management**: `/admin/consultations` — expandable cards, status change (PENDING/REVIEWED/CONTACTED), admin notes

### Working with Categories

Categories are managed in the admin UI (or seeded via Prisma) and assigned when creating/editing content.

**Category CTA**: Each category page can have custom CTA (title, description, button text/URL)

### Authentication & User Management

**Initial Setup**:
1. Visit `/admin/setup` (only works if no admin exists)
2. Create first admin user
3. Subsequent users created via admin panel

**Session Management**:
- 7-day expiration (configurable in `src/lib/auth.ts`)
- Cookie name: `better-auth.session_token`
- Middleware enforces auth on `/admin/*` routes

## Deployment Notes

### Vercel Deployment

**Build Command**: `npx prisma generate && next build`

**Environment Variables**: Set all variables from `.env` in Vercel dashboard

**Prisma Considerations**:
- Prisma client must be generated during build
- Uses connection pooling URL (`DATABASE_URL`) for runtime
- Direct URL (`DATABASE_URL_DIRECT`) required for migrations

### Infrastructure (Self-hosted on VPS via Coolify)

- **PostgreSQL**: `154.12.243.94:54320`, managed by Coolify
- **MinIO**: S3-compatible object storage, public bucket `media`, exposed via `https://media.scaletotop.com`
- Both services run in Docker containers on the same host

### Post-Deployment

1. Verify blog pages render at `/` and `/zh/blog` (ISR — see Caching Strategy)
2. Verify image uploads reach MinIO (`media` bucket)
3. After auth/coach changes, smoke-test on real device: email OTP, Google login, set-password (new user), language switch, site delete

## SEO Infrastructure

### Dynamic Sitemap & Robots

- **`src/app/sitemap.ts`** — Dynamic sitemap generated at request time. Queries Prisma for `PUBLISHED + PUBLIC` content and combines with static marketing routes. Do NOT use a static `public/sitemap.xml` — it will conflict.
- **`src/app/robots.ts`** — Dynamic robots config (replaces the old `public/robots.txt`). Returns a `MetadataRoute.Robots` object.

### Page Metadata Pattern

All public pages (`(public)/`) export `generateMetadata` or a static `metadata` object with:
- `title`, `description`, `alternates.canonical`
- `openGraph.images` pointing to `/api/og` (dynamic OG image) or a specific image URL

The root layout (`src/app/layout.tsx`) provides fallback metadata only. Page-level metadata always takes precedence.

### JSON-LD Structured Data

JSON-LD is injected inline per page via `<script type="application/ld+json">` in the page's `<head>`. Use the `JsonLd` component at `src/components/seo/JsonLd.tsx` when it exists, or inline the script directly in the page's metadata/head slot. Schema types in use: `WebSite`, `BlogPosting`, `BreadcrumbList`.

### Analytics & Tag Management

- **Google Tag Manager**: Loaded in `src/app/layout.tsx` via `next/script` with `strategy="afterInteractive"`. Only injected when `NEXT_PUBLIC_GTM_ID` is set AND `NODE_ENV === 'production'`.
- **PostHog**: Wrapped via `<CSPostHogProvider>` in root layout (`src/components/providers/PostHogProvider`). Active in all environments.

## OpenSpec Change Management

All significant feature work follows the OpenSpec workflow tracked in `openspec/`:

```
openspec/
  changes/
    <change-name>/          # Active change being implemented
      .openspec.yaml        # Change metadata
      design.md             # Design decisions
      proposal.md           # What & why
      specs/                # Detailed specs per feature area
      tasks.md              # Checklist of implementation tasks
    archive/                # Completed changes (prefixed with date)
  specs/                    # Living specs (canonical, updated in place)
```

**Workflow**:
1. `/openspec-propose` — Create a new change with all artifacts
2. `/openspec-apply-change` — Work through tasks.md
3. `/openspec-archive-change` — Move completed change to `archive/` with date prefix

**Rule**: Do not delete or modify specs in `openspec/specs/` directly — they are updated by the OpenSpec workflow. Archived changes in `openspec/changes/archive/` are read-only history.

## Caching Strategy

- **Public pages ISR**: homepage (`revalidate = 3600`) and blog index (`revalidate = 1800`) are statically generated + revalidated; publishing also `revalidatePath`s them on demand.
- **Data-layer cache**: `getPublishedContent` / `getPublishedContentBySlug` / `getActiveCategories` are wrapped in `unstable_cache` under tag `public-content` (busted on publish via `revalidateTag`). This is the main perf lever — local dev hits the remote DB at high latency, so caching takes pages from ~4s to ~20ms.
- **Site/user caches**: `getInitialSites` (sidebar) is tagged `user-${userId}`; **adding or deleting a site must call `revalidateUserSitesCache(userId)`** or the sidebar shows stale sites. Per-site data tagged `site-${siteId}`.
- **Coach home**: cached per-site under `coach-home-${siteId}`; coach actions bust it.
- Note: `<html lang>` is correct per-locale; full static-export of `[locale]` is intentionally NOT done (would require moving `<html>` out of the root layout).

## Troubleshooting

**Published article 404s**:
- Confirm publish set `visibility: PUBLIC` + `publishedAt` (handled by `updateContentMetadata`)
- Confirm the path was revalidated (`revalidateContentPaths`) and the `public-content` tag busted

**Deleted/added site still shows in sidebar**:
- The sidebar reads `getInitialSites` (tag `user-${userId}`). Ensure the delete/save route calls `revalidateUserSitesCache(userId)`.

**429 on `/get-session` / auth loops**:
- Check `rateLimit` in `src/lib/auth.ts` (max + `/get-session` rule) and that client session reads go through the single `SessionProvider` (no standalone `useSession`)

**Images not loading**:
- Verify `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`; bucket `media` has public read
- If `media.scaletotop.com` returns 504, fix the Coolify reverse proxy for MinIO port 9000 (see `openspec/technical-backlog.md`)
- Locally, the image domain may be intercepted by a proxy — add `media.scaletotop.com` to proxy DIRECT rules

**Auth redirect loops**:
- Clear cookies
- Verify `better-auth.session_token` is set correctly
- Check middleware logic in `src/middleware.ts`

**Build fails on Vercel**:
- Ensure `npx prisma generate` is in build command
- Verify all environment variables are set
- Check Prisma version matches package.json (5.22.0)

## Design Context

### Users

**Admin/Editor users** (internal team): author/publish content in-app, monitor platform metrics, handle user credits and permissions. Context: desktop-first, operational mindset — they need to act fast and trust what they see.

**Regular users** (English and Chinese-speaking businesses growing organic visibility via SEO/GEO): SEO/GEO analytics, content planning, site intelligence. Context: results-oriented, time-pressured, need to quickly understand what to do next.

Job to be done: "Show me what's happening and what I should do about it."

### Brand Personality

**专业 · 精准 · 可信** — Professional, Precise, Trustworthy.

Emotional goals when opening the dashboard: **信心** (confidence in the data), **掌控感** (control over their growth), **专业感** (this is a serious tool worth trusting).

### Aesthetic Direction

**Reference: Stripe Dashboard** — data-rich, chart-forward, operational density. Metrics are the hero. Information is not hidden; it's organized.

**Anti-references**: Avoid generic SaaS AI aesthetics — no purple gradients, no glassmorphism, no hero metric cards with fake sparklines, no card-in-card nesting, no decorative backgrounds that compete with data.

**Theme**: Light mode primary. Dark mode tokens exist but are secondary.

### Design Principles

1. **Data is the hero** — Charts and metrics lead every view. Empty states are informative, not decorative. Placeholder content (fake percentages, "加载中") must be replaced with real data or skeleton states.
2. **Density earns trust** — Stripe-style information density signals professionalism. Avoid over-simplified layouts that feel like marketing pages.
3. **Token discipline** — All colors must use `--color-brand-*` CSS variables or Tailwind `brand-*` classes. Never use ad-hoc Tailwind colors (`slate-900`, `emerald-600`, `blue-50`) directly in components.
4. **One primary action per view** — Clear action hierarchy. The most important next step is always obvious.
5. **Accessible by default** — WCAG AA minimum. Color is never the sole state indicator — always pair with label or icon.

