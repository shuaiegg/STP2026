/**
 * API endpoint to execute skills
 * POST /api/skills/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillRegistry } from '@/lib/skills';
import { registerAllSkills } from '@/lib/skills/skills';
import { SkillInput } from '@/lib/skills/types';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// Initialize skills on module load
registerAllSkills();

/**
 * Get credit cost for a skill
 */
function getSkillCost(skillName: string, input?: any): number {
    if (skillName === 'stellar-writer' && input?.auditOnly) {
        return 0; // Free audit
    }
    
    const costs: Record<string, number> = {
        'stellar-writer': 50,
    };
    return costs[skillName] || 10;
}

/**
 * Execute a skill
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized: Please login to use tools' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { skillName, input, options } = body as {
            skillName: string;
            input: SkillInput;
            options?: {
                provider?: 'gemini' | 'claude';
                model?: string;
            };
        };

        // Validate request
        if (!skillName) {
            return NextResponse.json({ error: 'skillName is required' }, { status: 400 });
        }

        if (!input) {
            return NextResponse.json({ error: 'input is required' }, { status: 400 });
        }

        // Get the skill
        const registry = getSkillRegistry();
        const skill = registry.getSkill(skillName);

        if (!skill) {
            return NextResponse.json(
                { error: `Skill '${skillName}' not found` },
                { status: 404 }
            );
        }

        // Check credits
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 5. Check if this is a repeat execution for the same keywords (Paid Project Logic)
        const executions = await prisma.skillExecution.findMany({
            where: {
                userId: user.id,
                skillName,
                status: 'success'
            },
            select: { input: true }
        });

        const isRepeat = executions.some(exe => 
            (exe.input as any)?.keywords === (input as any).keywords && 
            !(input as any).auditOnly
        );

        const cost = isRepeat ? 0 : getSkillCost(skillName, input);
        
        if (user.credits < cost) {
            return NextResponse.json(
                { error: `Insufficient credits. This tool requires ${cost} credits, but you have ${user.credits}.` },
                { status: 402 }
            );
        }

        // Execute the skill
        const startTime = Date.now();
        const result = await skill.execute(input);
        const executionTime = Date.now() - startTime;

        // Generate execution ID
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        // Process transaction and log in a Prisma transaction
        const dbResult = await prisma.$transaction(async (tx) => {
            // 1. Deduct credits
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    credits: {
                        decrement: cost
                    }
                }
            });

            // 2. Create transaction record
            const transaction = await tx.creditTransaction.create({
                data: {
                    userId: user.id,
                    amount: -cost,
                    type: 'CONSUMPTION',
                    description: `Used tool: ${skillName}`
                }
            });

            // 3. Create execution record
            const execution = await tx.skillExecution.create({
                data: {
                    id: executionId,
                    skillName,
                    userId: user.id,
                    transactionId: transaction.id,
                    status: 'success',
                    input: input as any,
                    output: result.data as any,
                    executionTimeMs: executionTime,
                    modelUsed: result.metadata.modelUsed,
                    provider: result.metadata.provider,
                    tokensUsed: result.metadata.tokensUsed,
                }
            });

            return { updatedUser, execution };
        });

        return NextResponse.json({
            success: true,
            executionId,
            output: result,
            executionTime,
            remainingCredits: dbResult.updatedUser.credits
        });
    } catch (error) {
        console.error('Skill execution error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Get execution status (for future async execution support)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
        return NextResponse.json(
            { error: 'executionId is required' },
            { status: 400 }
        );
    }

    // TODO: Implement execution status check from database
    return NextResponse.json({
        executionId,
        status: 'completed',
        message: 'Status checking not yet implemented',
    });
}
