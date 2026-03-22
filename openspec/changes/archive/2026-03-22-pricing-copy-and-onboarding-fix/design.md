## Context

The pricing page (`src/app/(public)/pricing/page.tsx`) currently uses a `getFeatures(credits)` function that returns different feature arrays per credit pack. These features are fabricated — none of them exist in the product. The page also has a `getDescription()` function with marketing copy that doesn't reflect the actual credit-consumption model.

The registration bonus is a one-time BONUS CreditTransaction created in `src/lib/auth.ts` via a `databaseHooks.user.create.after` hook. It currently grants 5 credits. This is below the cost of a single StellarWriter run (15 credits) and can only cover one site audit, making the free trial feel too limited.

## Goals / Non-Goals

**Goals:**
- Pricing page reflects the real credit system: same features for all, value scales with quantity
- New users receive 10 credits on registration (enough for 2 site audits or partial StellarWriter)
- Add a transparent cost reference table so users can calculate ROI before buying

**Non-Goals:**
- No changes to actual tool functionality or credit deduction logic
- No changes to the Creem product IDs or pricing amounts
- No changes to the SEO Health Report (already complete)
- No tier-based feature gating (this system intentionally has none)

## Decisions

**Decision: Remove `getFeatures()` entirely, replace with a single unified tagline per pack**
- Each pack card shows: credit count, price, per-credit cost calculation, and a single "可完成约 N 篇深度内容" line
- Rationale: Fabricated feature lists cause trust issues. Quantity-based framing is honest and still persuasive.

**Decision: Add credit cost reference table as a separate section below packs**
- Shows a simple table: tool name | credit cost | example usage
- Loaded statically (hardcoded to match SkillConfig seed values) — no API call on pricing page
- Rationale: Helps users calculate ROI; keeps the pricing page self-contained without auth dependency

**Decision: Change registration bonus from 5 → 10 in a single-line edit**
- The hook structure (idempotency check, Prisma transaction, BONUS type) is already correct
- Only the integer `5` changes to `10`

## Risks / Trade-offs

- [Risk] Credit reference table becomes stale if SkillConfig costs change → Mitigation: values match seed file; comment in code notes to update together
- [Risk] "约 N 篇" framing is approximate — StellarWriter may cost more/less per run → Mitigation: use "约" (approximately) and base on current 15-credit default
