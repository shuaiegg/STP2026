/**
 * API endpoint to execute skills
 * POST /api/skills/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillRegistry } from '@/lib/skills';
import { registerAllSkills } from '@/lib/skills/skills';
import { SkillInput } from '@/lib/skills/types';

// Initialize skills on module load
registerAllSkills();

/**
 * Execute a skill
 */
export async function POST(request: NextRequest) {
    try {
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
            return NextResponse.json(
                { error: 'skillName is required' },
                { status: 400 }
            );
        }

        if (!input) {
            return NextResponse.json(
                { error: 'input is required' },
                { status: 400 }
            );
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

        // Execute the skill
        const startTime = Date.now();
        const result = await skill.execute(input);
        const executionTime = Date.now() - startTime;

        // Generate execution ID
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        // TODO: Save execution to database for tracking
        // await saveExecutionRecord({
        //   id: executionId,
        //   skillName,
        //   input,
        //   output: result,
        //   ...
        // });

        return NextResponse.json({
            success: true,
            executionId,
            output: result,
            executionTime,
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
