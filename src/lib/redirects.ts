import prisma from '@/lib/prisma';

/**
 * 运行时重定向查询（Server Component / Route 用，可直接访问 Prisma）。
 *
 * 设计：重定向是稀有事件（slug 改名 + 类别迁移），且全部是 /blog 与 /blog/category 路径，
 * 这些路径本就会在页面层走 notFound 分支。因此重定向在页面 notFound 处查表即可，
 * 不放进 middleware（避免每个请求都付一次 DB/网络往返）。
 *
 * @param fromPath 完整路径（含 locale 前缀）。可传多个候选以容错编码差异
 *   （路由 params 的 CJK slug 可能是 percent-encoded 也可能已解码，取决于运行时）
 */
export async function findRedirect(
    fromPath: string | string[],
): Promise<{ toPath: string; statusCode: number } | null> {
    const candidates = Array.from(new Set(Array.isArray(fromPath) ? fromPath : [fromPath]));
    try {
        return await prisma.redirect.findFirst({
            where: { fromPath: { in: candidates } },
            select: { toPath: true, statusCode: true },
        });
    } catch {
        return null;
    }
}

/**
 * 为带 slug 的路径生成编码容错的候选 fromPath 列表。
 * 同时覆盖：原始 slug、解码后、（解码再）规范 percent-encode 三种形态。
 */
export function redirectCandidates(prefix: string, slug: string): string[] {
    let decoded = slug;
    try { decoded = decodeURIComponent(slug); } catch { /* slug 非法编码，保持原样 */ }
    return [
        `${prefix}${slug}`,
        `${prefix}${decoded}`,
        `${prefix}${encodeURIComponent(decoded)}`,
    ];
}
