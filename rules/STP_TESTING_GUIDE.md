# STP Testing & QA Guide (The Aladdin Protocol)

To minimize bugs and ensure high-velocity development without regression, the following QA protocol is mandatory for Aladdin (the agent).

## 1. The "Definition of Done" (DoD)
A task is NOT complete until:
- [ ] Core logic is implemented and linted.
- [ ] A corresponding verification script exists in `scripts/verify-*.ts`.
- [ ] Aladdin has executed the script and confirmed 100% success.
- [ ] Any UI components involved have been visually/interactively verified (where applicable).

## 2. Testing Layers

### A. Skill/Backend Logic (`scripts/verify-*.ts`)
- Every new "Skill" (AI logic) must have a test script that mocks inputs and verifies the output structure and quality.
- Use `npx ts-node` to run these scripts in the environment.

### B. API & Auth Verification
- For sensitive flows (Login, OTP, Billing), use scripts that invoke the internal service functions directly to ensure state transitions are correct.

### C. UI/UX Consistency
- Components must follow `ui-ux-pro-max` standards.
- Check for mobile responsiveness and error states (loading, empty, error).

## 3. Mandatory Verification Scripts
When working on these areas, Aladdin MUST run the associated script:
- **Auth/User**: `scripts/verify-auth.ts` (Validates login, OTP, and password flows)
- **Billing**: `scripts/verify-billing.ts` (Validates credit deduction and transaction logging)
- **Content/Sync**: `scripts/verify-content.ts` (Validates Notion sync and image processing)

## 4. Reporting Format
When Aladdin reports task completion, it should include a brief "QA Report":
> **QA Report:**
> - ✅ Script `verify-xxx.ts` passed.
> - ✅ Mobile UI checked.
> - ✅ Error states handled.

---
*Last Updated: 2026-02-07*
