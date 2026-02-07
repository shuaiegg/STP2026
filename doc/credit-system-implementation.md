# Credit System & Skill Management Implementation Guide

**Last Updated**: 2026-02-06
**Module**: Billing / Admin

## 1. System Overview
The credit system allows for dynamic pricing of AI tools ("Skills") without code deployment. Administrators can manage tool costs and visibility via the Admin Dashboard, while the backend ensures atomic transactions for credit deduction.

---

## 2. Database Schema

### Skill Configuration (`SkillConfig`)
Stores the pricing and status of each tool.
```prisma
model SkillConfig {
  id          String   @id @default(uuid())
  name        String   @unique // SYSTEM_NAME (e.g. "GEO_WRITER_FULL")
  displayName String   // UI Label
  description String?
  cost        Int      @default(0) // Cost in credits
  isActive    Boolean  @default(true) // Kill switch
  ...
}
```

### Transaction Log (`CreditTransaction`)
Records every credit change for audit trails.
```prisma
model CreditTransaction {
  id          String   @id @default(uuid())
  userId      String
  amount      Int      // Consumed amount
  type        TransactionType // CONSUMPTION, PURCHASE, etc.
  description String   // "GEO Writer Generation: keyword..."
  ...
}
```

---

## 3. Core Billing Logic
**File**: `src/lib/billing/credits.ts`

The `chargeUser` function handles the deduction securely using a Prisma Transaction to ensure data consistency.

### Key Features:
*   **Atomic**: Deducting credits and recording the log happen together. If one fails, both rollback.
*   **Dynamic**: Fetches the *current* cost from `SkillConfig` at section run-time.
*   **Safe**: Checks balance (`user.credits < cost`) before deduction.

```typescript
export async function chargeUser(userId: string, skillName: string, description: string) {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch Dynamic Cost
        const skill = await tx.skillConfig.findUnique({ where: { name: skillName } });
        if (!skill.isActive) throw new Error("Tool disabled");
        
        // 2. Check Balance
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user.credits < skill.cost) throw new Error("Insufficient credits");

        // 3. Deduct & Log
        await tx.user.update({
            where: { id: userId },
            data: { credits: { decrement: skill.cost } }
        });
        
        await tx.creditTransaction.create({ ... }); // Record log
        
        return { success: true, remaining: ... };
    });
}
```

---

## 4. Workflow: Adding a New Tool

### Step 1: Register in Admin UI
1.  Navigate to `/admin/skills`.
2.  Click **"+ Add New Skill"**.
3.  Fill in the details:
    *   **System Name**: `MY_NEW_TOOL` (Uppercase, no spaces)
    *   **Display Name**: "My Awesome Feature"
    *   **Cost**: `10`
4.  Click **Create**. The tool is now live in the database.

### Step 2: Implement in Code
In your API route or Server Action, integrate the billing check:

```typescript
// src/app/api/my-tool/route.ts
import { chargeUser } from '@/lib/billing/credits';

export async function POST(req) {
    const session = await auth();
    
    // Call the system name you registered in Step 1
    const result = await chargeUser(
        session.user.id, 
        'MY_NEW_TOOL', 
        'Generation request'
    );

    if (!result.success) {
        return Response.json({ error: result.error }, { status: 402 });
    }

    // ... Proceed with AI logic ...
}
```

---

## 5. Administration
*   **Modify Price**: Go to `/admin/skills`, click "Edit Cost", save. Changes apply immediately to the next API call.
*   **Emergency Stop**: Toggle the "Active" status to "Disabled". All API calls for that tool will be rejected instantly.
