'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create category
 */
export async function createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    ctaTitle?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
    order?: number;
}) {
    try {
        const category = await prisma.category.create({
            data: {
                ...data,
                order: data.order ?? 0,
            },
        });

        revalidatePath('/blog');

        return {
            success: true,
            message: `Created: ${category.name}`,
            data: category,
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Update category
 */
export async function updateCategory(
    categoryId: string,
    data: {
        name?: string;
        slug?: string;
        description?: string;
        ctaTitle?: string;
        ctaDescription?: string;
        ctaButtonText?: string;
        ctaButtonUrl?: string;
        order?: number;
        isActive?: boolean;
        noIndex?: boolean;
    }
) {
    try {
        const category = await prisma.category.update({
            where: { id: categoryId },
            data,
        });

        revalidatePath('/blog');
        revalidatePath(`/blog/category/${category.slug}`);

        return {
            success: true,
            message: `Updated: ${category.name}`,
            data: category,
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Delete category (soft delete by setting isActive = false)
 */
export async function deactivateCategory(categoryId: string) {
    try {
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { isActive: false },
        });

        // Unlink all content from this category
        await prisma.content.updateMany({
            where: { categoryId },
            data: { categoryId: null },
        });

        revalidatePath('/blog');

        return {
            success: true,
            message: `Deactivated: ${category.name}`,
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Reorder categories
 */
export async function reorderCategories(orderedIds: string[]) {
    try {
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.category.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );

        revalidatePath('/blog');

        return {
            success: true,
            message: 'Categories reordered',
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}
