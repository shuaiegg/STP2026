## Why

The current pricing page presents tier-specific features (multi-version snapshots, PDF export, priority AI channel, competitor outline parsing, etc.) that do not exist in the product — creating a trust gap for paying users. ScaletoTop is a pure credit system with no feature gating: all tools are accessible to anyone with sufficient credits. The pricing page must reflect this reality. Additionally, the registration bonus (5 credits) is too low to allow a meaningful first experience; 10 credits lets new users complete at least two site audits or a partial StellarWriter run.

## What Changes

- **Pricing page copy rewrite**: Remove all tier-specific feature lists. Replace with credit-quantity framing ("50 积分可完成约 3 篇深度内容创作"). Add a credit cost reference table below the packs showing real tool costs from SkillConfig.
- **Registration bonus increase**: Change the new-user credit grant from 5 to 10 credits in the auth hook.

## Capabilities

### New Capabilities
- `pricing-credit-framing`: Pricing page presents value as credit quantity and what users can accomplish, with a cost reference table. No tier feature gates.

### Modified Capabilities
- `registration-credit-bonus`: Registration bonus amount changes from 5 → 10 credits.

## Impact

- `src/app/(public)/pricing/page.tsx` — copy and layout changes (getFeatures removed, credit reference table added)
- `src/lib/auth.ts` — single integer change in user.create.after hook
