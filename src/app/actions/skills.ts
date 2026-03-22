'use server'

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/auth-utils";

/**
 * Get all skill configurations
 */
export async function getSkillConfigs() {
    await checkAdmin();

    const skills = await prisma.skillConfig.findMany({
        orderBy: { name: 'asc' }
    });

    return skills;
}

/**
 * Update the cost of a skill
 */
export async function updateSkillCost(id: string, newCost: number) {
    await checkAdmin();

    if (newCost < 0) {
        throw new Error("Cost cannot be negative");
    }

    const result = await prisma.skillConfig.update({
        where: { id },
        data: { cost: newCost }
    });

    revalidatePath('/dashboard/admin/skills');
    return { success: true, data: result };
}

/**
 * Toggle the active status of a skill
 */
export async function toggleSkill(id: string) {
    await checkAdmin();

    const skill = await prisma.skillConfig.findUnique({
        where: { id },
        select: { isActive: true }
    });

    if (!skill) throw new Error("Skill not found");

    const result = await prisma.skillConfig.update({
        where: { id },
        data: { isActive: !skill.isActive }
    });

    revalidatePath('/dashboard/admin/skills');
    return { success: true, data: result };
}

/**
 * Create a new skill configuration
 */
export async function createSkill(data: { name: string; displayName: string; description: string; cost: number }) {
    await checkAdmin();

    const existing = await prisma.skillConfig.findUnique({
        where: { name: data.name }
    });

    if (existing) {
        throw new Error("Skill with this system name already exists");
    }

    const result = await prisma.skillConfig.create({
        data: {
            ...data,
            isActive: true
        }
    });

    revalidatePath('/dashboard/admin/skills');
    return { success: true, data: result };
}
