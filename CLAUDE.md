# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScaletoTop is a Next.js 16 (App Router) full-stack CMS platform that uses Notion as a content source. It syncs content from Notion, automatically processes images to Supabase Storage, and publishes to a public blog/marketing site with an admin backend.

**Tech Stack**: Next.js 16, React 19, Prisma ORM, PostgreSQL (Supabase), Notion API, better-auth, TailwindCSS

## Development Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000

# Rules & Standards
# Refer to rules/STP_RULES.md for engineering guidelines
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
  - `/` - Homepage
  - `/blog` - Blog listing
  - `/blog/[slug]` - Blog post detail
  - `/blog/category/[slug]` - Category listing
  - `/course`, `/tools` - Static pages
  - `/preview/[token]` - Preview unpublished content via token

- **`admin/`** - Protected admin routes (requires authentication)
  - `/admin` - Dashboard
  - `/admin/login` - Login page (redirects to /admin if already logged in)
  - `/admin/setup` - Initial admin user setup (unprotected)
  - `/admin/content` - Content management
  - `/admin/sync` - Notion sync interface

- **`api/auth/[...all]`** - better-auth API routes (handled by middleware)

### Authentication Flow

Uses **better-auth** with session cookies:
1. Middleware (`src/middleware.ts`) checks for `better-auth.session_token` cookie
2. All `/admin/*` routes (except `/admin/login` and `/admin/setup`) require valid session
3. Session management handled by better-auth with Prisma adapter
4. User roles: `ADMIN` and `EDITOR` (stored in User table)

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
- Supports custom OG images and canonical URLs

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


