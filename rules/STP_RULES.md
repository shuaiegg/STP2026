# STP Engineering Standards & Rules

These rules are synthesized from high-performance AI coding patterns and optimized for the ScaletoTop (STP) project.

## 1. Immutability & State Management
- **Immutability is Mandatory**: Never mutate objects or arrays. Always use the spread operator or functional updates.
- **Next.js Server Components**: Favor Server Components for data fetching. Use Client Components only when interactivity (hooks, event listeners) is required.
- **Zod Validation**: All external data (Notion API, Form submissions, API requests) MUST be validated using Zod schemas.

## 2. Component Architecture
- **Composition Over Inheritance**: Build small, focused components and compose them.
- **Compound Components**: For complex UI elements (Tabs, Accordions, Modals), use the Compound Component pattern with Context.
- **Custom Hooks**: Extract complex logic into custom hooks (e.g., `useNotionSync`, `useContentEditor`).
- **File Size**: Keep components under 400 lines. If it grows larger, extract sub-components or utilities.

## 3. SEO & Performance
- **Static First**: Use ISR (Incremental Static Regeneration) for all public pages.
- **Image Optimization**: Always use `next/image` with proper `width`, `height`, and `alt` text. Ensure Supabase URLs are correctly configured in `next.config.ts`.
- **Metadata**: Every public page must have a unique meta title and description, managed via the `SeoMeta` table.
- **Dynamic Imports**: Use `dynamic()` for heavy components or those not needed on initial load to reduce bundle size.

## 4. Error Handling & Logging
- **Comprehensive Try-Catch**: Wrap all async operations in try-catch blocks.
- **User-Friendly Errors**: Log the technical error for debugging, but return a clean, actionable message to the UI.
- **Sync Logs**: Every Notion sync operation must log its status, duration, and any errors to the `SyncLog` table.

## 5. Development Workflow
- **Atomic Commits**: Commit small, logical changes. Follow the format: `feat: ...`, `fix: ...`, `chore: ...`.
- **TDD (Test-Driven Development)**: For complex logic (like image URL parsing or reading time calculation), write tests before implementation.
- **Documentation**: Keep `CLAUDE.md` and `MEMORY.md` updated with every significant architectural change.

## 6. AI Interaction Rules
- **Plan Mode**: Before starting a complex task, output a step-by-step plan.
- **Verify Loop**: After implementing a feature, verify it by running the build or specific tests.
- **Rule Reference**: I (Aladdin) will always consult the `rules/` directory before making significant changes.
