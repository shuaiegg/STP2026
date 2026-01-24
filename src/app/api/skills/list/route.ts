/**
 * API endpoint to list available skills
 * GET /api/skills/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillRegistry } from '@/lib/skills';
import { registerAllSkills } from '@/lib/skills/skills';

// Initialize skills on module load
registerAllSkills();

/**
 * List all available skills
 */
export async function GET(request: NextRequest) {
    try {
        const registry = getSkillRegistry();

        // Get all skill metadata
        const allMetadata = registry.getAllMetadata();

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Filter by category if specified
        let skills = allMetadata;
        if (category) {
            skills = skills.filter(skill => skill.category === category);
        }

        return NextResponse.json({
            success: true,
            count: skills.length,
            skills: skills.map(skill => ({
                name: skill.name,
                description: skill.description,
                version: skill.version,
                category: skill.category,
                requiredInputs: skill.requiredInputs,
                optionalInputs: skill.optionalInputs,
                exampleInput: skill.exampleInput,
                estimatedCost: skill.estimatedCost,
            })),
        });
    } catch (error) {
        console.error('Error listing skills:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
