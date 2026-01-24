'use server';

import prisma from '@/lib/prisma';
import { updateNotionPageProperties } from '@/lib/notion/client';
import { revalidatePath } from 'next/cache';

export async function updateContentMetadata(id: string, data: {
    title?: string;
    slug?: string;
    summary?: string;
    contentMd?: string;
}) {
    try {
        // 1. Get the content item to get the notionPageId
        const content = await prisma.content.findUnique({
            where: { id },
            select: { notionPageId: true }
        });

        if (!content || !content.notionPageId) {
            throw new Error('Content not found or not connected to Notion');
        }

        // 2. Prepare Notion properties
        const properties: any = {};
        if (data.title) {
            properties.Title = {
                title: [{ text: { content: data.title } }]
            };
        }
        if (data.slug) {
            properties.Slug = {
                rich_text: [{ text: { content: data.slug } }]
            };
        }
        if (data.summary) {
            properties.Summary = {
                rich_text: [{ text: { content: data.summary } }]
            };
        }

        // 3. Update Notion Properties (Best Effort)
        try {
            await updateNotionPageProperties(content.notionPageId, properties);
        } catch (notionError) {
            console.error('Warning: Failed to sync properties to Notion:', notionError);
        }

        // 4. Update Notion Content (Blocks) if provided (Best Effort)
        if (data.contentMd) {
            try {
                const { updateNotionPageContent } = await import('@/lib/notion/client');
                await updateNotionPageContent(content.notionPageId, data.contentMd);
            } catch (notionError) {
                console.error('Warning: Failed to sync content to Notion:', notionError);
            }
        }

        // 5. Update local database
        await prisma.content.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                summary: data.summary,
                contentMd: data.contentMd,
                updatedAt: new Date()
            }
        });

        // 6. Revalidate
        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${id}`);
        if (data.slug) {
            revalidatePath(`/blog/${data.slug}`);
        }
        revalidatePath('/blog');

        return { success: true };
    } catch (error) {
        console.error('Failed to update content metadata:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Update or create SEO metadata for a content item
 */
export async function updateSeoMetadata(contentId: string, data: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    ogImageId?: string;
    // New SEO/GEO fields
    keywords?: string[];
    schemaJson?: string;
    geoScore?: number;
    snippetLinkedIn?: string;
    snippetReddit?: string;
    snippetTwitter?: string;
    suggestedLinks?: string[];
}) {
    try {
        // Check if content exists
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: { id: true, slug: true }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        // Upsert SeoMeta (create if not exists, update if exists)
        await prisma.seoMeta.upsert({
            where: { contentId },
            create: {
                contentId,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                canonicalUrl: data.canonicalUrl,
                noIndex: data.noIndex ?? false,
                ogImageId: data.ogImageId,
                keywords: data.keywords ?? [],
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: data.geoScore ? new Date() : undefined,
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks ?? [],
            },
            update: {
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                canonicalUrl: data.canonicalUrl,
                noIndex: data.noIndex,
                ogImageId: data.ogImageId,
                keywords: data.keywords,
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: data.geoScore ? new Date() : undefined,
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks,
            }
        });

        // Revalidate paths
        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${contentId}`);
        revalidatePath(`/blog/${content.slug}`);
        revalidatePath('/blog');

        return { success: true };
    } catch (error) {
        console.error('Failed to update SEO metadata:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Save complete SEO/GEO optimization data (from AI optimization)
 */
export async function saveSeoOptimizationData(contentId: string, data: {
    // Basic SEO
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    // Schema
    schemaJson: string;
    // Distribution
    snippetLinkedIn?: string;
    snippetReddit?: string;
    snippetTwitter?: string;
    // Audit
    geoScore: number;
    suggestedLinks?: string[];
    // Optionally update content
    contentMd?: string;
}) {
    try {
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: { id: true, slug: true, notionPageId: true }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        // Update content if provided
        if (data.contentMd) {
            await prisma.content.update({
                where: { id: contentId },
                data: {
                    contentMd: data.contentMd,
                    updatedAt: new Date()
                }
            });

            // Sync to Notion if connected
            if (content.notionPageId) {
                try {
                    const { updateNotionPageContent } = await import('@/lib/notion/client');
                    await updateNotionPageContent(content.notionPageId, data.contentMd);
                } catch (e) {
                    console.warn('Failed to sync content to Notion:', e);
                }
            }
        }

        // Upsert all SEO data
        await prisma.seoMeta.upsert({
            where: { contentId },
            create: {
                contentId,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                keywords: data.keywords,
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: new Date(),
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks ?? [],
            },
            update: {
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                keywords: data.keywords,
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: new Date(),
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks,
            }
        });

        // Revalidate
        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${contentId}`);
        revalidatePath(`/blog/${content.slug}`);
        revalidatePath('/blog');

        return { success: true };
    } catch (error) {
        console.error('Failed to save SEO optimization data:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get content with SEO metadata for editing
 */
export async function getContentForSeoEdit(contentId: string) {
    try {
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            include: {
                seo: true,
                category: true,
                coverImage: true,
            }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        return { success: true, data: content };
    } catch (error) {
        console.error('Failed to get content for SEO edit:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Analyze content and return SEO/GEO audit results
 */
export async function analyzeContentSeo(contentId: string) {
    try {
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: {
                title: true,
                summary: true,
                contentMd: true,
                seo: true,
            }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        const markdown = content.contentMd || '';
        const title = content.seo?.metaTitle || content.title || '';
        const description = content.seo?.metaDescription || content.summary || '';

        // Title analysis
        if (title.length < 30) {
            issues.push('标题过短，建议 50-60 字符');
            score -= 10;
        } else if (title.length > 60) {
            suggestions.push(`标题过长（${title.length} 字符），可能被截断`);
            score -= 5;
        }

        // Description analysis
        if (description.length < 80) {
            issues.push('描述过短，建议 120-160 字符');
            score -= 10;
        } else if (description.length > 160) {
            suggestions.push(`描述过长（${description.length} 字符），可能被截断`);
            score -= 5;
        }

        // Heading structure
        const h1Count = (markdown.match(/^#\s+/gm) || []).length;
        const h2Count = (markdown.match(/^##\s+/gm) || []).length;

        if (h1Count === 0) {
            issues.push('缺少 H1 标题');
            score -= 10;
        } else if (h1Count > 1) {
            issues.push(`存在 ${h1Count} 个 H1 标题，应只有 1 个`);
            score -= 5;
        }

        if (h2Count < 3) {
            suggestions.push('H2 标题数量偏少，建议 3-7 个主要章节');
            score -= 5;
        }

        // First paragraph check (Direct Answer)
        const paragraphs = markdown.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
        if (paragraphs.length > 0) {
            const firstPara = paragraphs[0];
            if (firstPara.length > 200) {
                suggestions.push('首段过长，AI 难以快速提取核心答案，建议精简至 50-60 字');
                score -= 10;
            }
        }

        // Lists and tables
        const hasList = /^[-*]\s+/m.test(markdown);
        const hasTable = /\|.*\|/.test(markdown);

        if (!hasList && !hasTable) {
            suggestions.push('建议添加列表或表格增强结构化');
            score -= 5;
        }

        // Internal links
        const internalLinks = (markdown.match(/\[([^\]]+)\]\((?!http)/g) || []).length;
        if (internalLinks < 3) {
            suggestions.push(`内链数量偏少（${internalLinks}），建议 3-5 个相关内链`);
            score -= 5;
        }

        return {
            success: true,
            data: {
                score: Math.max(0, score),
                passed: score >= 70,
                issues,
                suggestions,
                stats: {
                    titleLength: title.length,
                    descriptionLength: description.length,
                    h1Count,
                    h2Count,
                    internalLinks,
                    hasList,
                    hasTable,
                }
            }
        };
    } catch (error) {
        console.error('Failed to analyze content SEO:', error);
        return { success: false, error: String(error) };
    }
}
