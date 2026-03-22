# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScaletoTop is a Next.js 16 (App Router) full-stack CMS platform that uses Notion as a content source. It syncs content from Notion, automatically processes images to Supabase Storage, and publishes to a public blog/marketing site with an admin backend.

**Tech Stack**: Next.js 16, React 19, Prisma ORM, PostgreSQL (Supabase), Notion API, better-auth, TailwindCSS

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

## Architecture Overview

### Route Structure

The app uses Next.js App Router with route groups:

- **`(public)/`** - Public-facing routes (no auth required)
  - `/` - Homepage; `/blog`, `/blog/[slug]`, `/blog/category/[slug]` - Blog
  - `/login`, `/register`, `/forgot-password`, `/reset-password` - User auth
  - `/pricing`, `/tools`, `/tools/geo-writer`, `/course` - Marketing pages
  - `/preview/[token]` - Preview unpublished content via token

- **`(protected)/dashboard/`** - Authenticated user routes
  - `/dashboard/site-intelligence` - SEO site analysis (list + `[siteId]` detail)
  - `/dashboard/site-intelligence/instant-audit` - One-shot site audit
  - `/dashboard/library` - User article library with `/edit/[id]`
  - `/dashboard/tools` - AI tools; `/dashboard/billing` - Credits; `/dashboard/settings`

- **`admin/`** - CMS admin routes (ADMIN/EDITOR role required)
  - `/admin` - Dashboard; `/admin/content` - Content management; `/admin/sync` - Notion sync
  - `/admin/login` - Login; `/admin/setup` - First-run setup (unprotected); `/admin/users`, `/admin/skills`

- **`api/`** - API routes
  - `api/auth/[...all]` - better-auth handlers
  - `api/dashboard/sites/[siteId]/*` - Site intelligence endpoints (audits, competitors, GSC/GA4, strategy)
  - `api/generate-stream`, `api/generate-enrich` - Streaming AI generation
  - `api/skills/execute`, `api/skills/list` - Skills execution API
  - `api/webhooks/creem` - Creem.io payment webhook
  - `api/cron/verify` - Cron job verification

### Authentication Flow

Uses **better-auth** with session cookies and Google OAuth:
1. Middleware (`src/middleware.ts`) checks for `better-auth.session_token` cookie
2. `/admin/*` routes (except `/admin/login` and `/admin/setup`) require ADMIN or EDITOR role
3. `/(protected)/*` routes require any authenticated session (USER role sufficient)
4. Session management handled by better-auth with Prisma adapter
5. User roles: `ADMIN`, `EDITOR`, `USER` (stored in User table)

### Notion Sync Architecture

**Critical Flow**: Notion Database → Sync Engine → PostgreSQL + Supabase Storage → Public Site

**Key Files**:
- `src/lib/notion/sync.ts` - Core sync logic
- `src/app/actions/sync.ts` - Server actions for triggering syncs

**Sync Process**:
1. Query Notion database for pages with `Status = "Ready"`
2. For each page:
   - Extract properties: Title, Slug, Summary, Category, Cover, ReadingTime
   - Convert Notion blocks to Markdown using `notion-to-md`
   - Download ALL images from Notion URLs
   - Upload images to Supabase Storage (`media` bucket)
   - Replace image URLs in markdown with Supabase URLs
   - Calculate reading time (300 chars/min for CJK, 200 words/min for English)
   - Upsert to `Content` table
3. Log sync operation to `SyncLog` table
4. Call `revalidatePath()` to update Next.js cache

**Incremental Sync**: Compares `notionLastEditedAt` timestamps to skip unchanged pages (unless `force: true`)

**Image Processing**:
- All images (cover + inline) downloaded from Notion and uploaded to Supabase
- Stored in `Media` table with `notionBlockId` for deduplication
- Custom transformer in `notion-to-md` ensures images are captured

### AI Skills System

**Architecture**: `src/lib/skills/` — pluggable AI tool framework with credit metering

- `base-skill.ts` - Abstract base class; all skills extend `BaseSkill`
- `skill-registry.ts` - Singleton registry; use `getSkillRegistry()` to look up skills
- `providers/` - Multi-provider: `claude-provider.ts`, `gemini-provider.ts`, `deepseek-provider.ts`
- Skills are executed via `api/skills/execute` and logged to `SkillExecution` table
- Each execution deducts credits from `User.credits` and records a `CreditTransaction`
- Admin can configure skills via `SkillConfig` table (cost, active status)

**Server Actions**: `src/app/actions/skills.ts` — execute skills server-side

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
- Status: `DRAFT` → `SYNCED` → `PUBLISHED` → `ARCHIVED`
- Visibility: `PUBLIC`, `PRIVATE`, `UNLISTED`
- Source: `NOTION` (synced) or `MANUAL` (created in admin)

**Categories**:
- Manually managed, NOT auto-created during sync
- Sync finds existing categories by name (case-insensitive) or creates with slug
- Each category has CTA configuration for category pages

**Media**:
- Centralized storage for all images
- Linked via `coverImageId` in Content and `ogImageId` in SeoMeta
- Deduplication via `notionBlockId`

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

## Important Environment Variables

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=              # Connection pool URL (for runtime)
DATABASE_URL_DIRECT=       # Direct connection (for Prisma migrations)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # Public Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Admin key (for image uploads, server-side only)

# Notion
NOTION_API_KEY=           # Notion integration token
NOTION_DATABASE_ID=       # Database ID (from URL between notion.so/ and ?v=)

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
```

## Notion Database Requirements

Your Notion database MUST have these properties (case-sensitive):

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| Title | Title | Yes | Post title |
| Slug | Text | Yes | URL slug (e.g., `my-first-post`) |
| Status | Select | Yes | Must have "Ready" option - only syncs if Status = "Ready" |
| Category | Select | No | Category name (must match existing category) |
| Summary | Text | No | Post excerpt |
| Cover | Files & media | No | Cover image (fallback to page cover) |
| ReadingTime | Text/Number | No | Manual override (auto-calculated if missing) |

## Server Actions Pattern

All data mutations use Next.js Server Actions (`'use server'`):
- `src/app/actions/sync.ts` - Notion sync operations
- `src/app/actions/content.ts` - Content CRUD
- `src/app/actions/category.ts` - Category management
- `src/app/actions/auth.ts` - Authentication helpers
- `src/app/actions/skills.ts` - AI skill execution
- `src/app/actions/user.ts` - User profile and credit management
- `src/app/actions/tracked-articles.ts` - GEO citation article tracking
- `src/app/actions/update-article.ts`, `delete-article.ts` - Library article management

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
4. Update `src/lib/notion/sync.ts` to extract from Notion (if applicable)
5. Update admin forms in `src/app/admin/content/`
6. Restart dev server

### Triggering Notion Sync

**Via Admin UI**: Navigate to `/admin/sync` and click "Sync All" or "Sync Single"

**Programmatically**:
```typescript
import { syncAllContent } from '@/app/actions/sync';

// Full sync
await syncAllContent({ force: false });

// Force sync (ignore timestamps)
await syncAllContent({ force: true });
```

**Via API Route** (for cron jobs): Create an API route at `src/app/api/sync/all/route.ts`

### Handling Image Storage

Images are automatically handled during sync. For manual uploads:

```typescript
import { uploadImageFromUrl } from '@/lib/storage';

const result = await uploadImageFromUrl(imageUrl, {
  notionBlockId: 'unique-id', // for deduplication
});
// Returns: { mediaId, storageUrl, storagePath }
```

**Storage bucket requirements**:
- Name: `media`
- Public access enabled
- Upload policy allows Service Role Key

### Working with Categories

Categories are pre-defined and managed separately from Notion:

1. Seed via Prisma or create in admin UI
2. Notion sync finds categories by name match
3. If category doesn't exist, sync creates it with auto-generated slug

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

### Supabase Setup

1. Create PostgreSQL database
2. Create public storage bucket named `media`
3. Configure RLS policies or disable for development
4. Copy connection URLs to environment variables

### Post-Deployment

1. Run initial sync: Visit `/admin/sync` and trigger "Sync All"
2. Verify images are uploaded to Supabase Storage
3. Check blog pages are accessible at `/blog`

## Caching Strategy

- **ISR (Incremental Static Regeneration)**: Blog pages use on-demand revalidation
- **Revalidation**: Triggered after sync via `revalidatePath('/blog')` and `revalidatePath('/')`
- **Dynamic Routes**: `/blog/[slug]` generated on-demand, cached until revalidated

## Troubleshooting

**Sync fails with "Page missing required Slug property"**:
- Ensure Notion page has Slug field filled
- Check property name is exactly "Slug" (case-sensitive)

**Images not syncing**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check `media` bucket exists and is public
- Look for errors in sync logs (`SyncLog` table)

**Categories not matching**:
- Categories must exist in database before sync
- Sync matches by name (case-insensitive)
- Auto-creates if missing, but verify slug generation

**Auth redirect loops**:
- Clear cookies
- Verify `better-auth.session_token` is set correctly
- Check middleware logic in `src/middleware.ts`

**Build fails on Vercel**:
- Ensure `npx prisma generate` is in build command
- Verify all environment variables are set
- Check Prisma version matches package.json (5.22.0)


