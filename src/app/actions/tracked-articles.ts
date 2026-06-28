'use server'

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { coachHomeTag } from "@/lib/coach/home";
import { z } from "zod";

const saveArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  optimizedContent: z.string().min(1, "Content is required"),
  contentHtml: z.string().optional(),
  plannedArticleId: z.string().optional(),
  /** 关联站点 ID（可空，旧有调用不传则退化为仅 userId） */
  siteId: z.string().optional(),
  /** 来源支柱话题（从蓝图"开始写作"进入时带入） */
  sourcePillar: z.string().optional(),
});

export type SaveArticleInput = z.infer<typeof saveArticleSchema>;

/**
 * 将生成后的文章保存到用户后台
 */
export async function saveTrackedArticle(input: SaveArticleInput) {
  try {
    // 1. 鉴权
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, message: "Unauthorized. Please login first." };
    }

    // 2. 校验数据
    const validated = saveArticleSchema.parse(input);

    // 3. 存储到数据库
    const article = await prisma.$transaction(async (tx) => {
      const trackedArticle = await tx.trackedArticle.create({
        data: {
          userId: session.user.id,
          title: validated.title,
          summary: validated.summary,
          keywords: validated.keywords,
          optimizedContent: validated.optimizedContent,
          contentHtml: validated.contentHtml,
          status: "PENDING",
          // 新增字段：可空，旧有调用不受影响
          siteId: validated.siteId ?? null,
          sourcePillar: validated.sourcePillar ?? null,
        },
      });

      if (validated.plannedArticleId) {
        await tx.plannedArticle.update({
          where: { id: validated.plannedArticleId },
          data: {
            articleId: trackedArticle.id,
            status: 'IN_PROGRESS'
          }
        });
      }

      return trackedArticle;
    });

    console.log(`[SaveArticle] Saved article ${article.id} for user ${session.user.id}`);

    return { 
      success: true, 
      message: "Article saved to your library successfully!", 
      data: article 
    };
  } catch (error) {
    console.error("[SaveArticle] Error saving article:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Invalid data provided." };
    }
    return { success: false, message: "Failed to save article. Please try again." };
  }
}

const backfillSchema = z.object({
  articleId: z.string().min(1),
  url: z.string().url("请输入合法的 URL"),
});

/**
 * 回填已发布文章的 URL（接通既有 SERP 验证 cron）
 * 文案承诺：验证 Google 搜索收录与排名，不宣称 AI 引用。
 */
export async function backfillArticleUrl(input: { articleId: string; url: string }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, message: "Unauthorized. Please login first." };
    }

    const validated = backfillSchema.parse(input);

    // 校验归属：确保该文章属于当前用户
    const existing = await prisma.trackedArticle.findFirst({
      where: { id: validated.articleId, userId: session.user.id },
      select: { id: true, status: true, siteId: true },
    });

    if (!existing) {
      return { success: false, message: "Article not found or access denied." };
    }

    // 写入 URL；status 保持 PENDING，cron 下次跑时自动触发 SERP 验证
    await prisma.trackedArticle.update({
      where: { id: validated.articleId },
      data: {
        url: validated.url,
        status: "PENDING",
      },
    });

    // 失效相关缓存：内容库列表 + 该站点的教练主页（支柱 drafted → pending_verify）
    revalidatePath('/dashboard/library');
    if (existing.siteId) {
      revalidateTag(coachHomeTag(existing.siteId), 'max');
    }

    console.log(`[BackfillURL] Article ${validated.articleId} url set to ${validated.url}`);

    return { success: true, message: "URL 已回填，将在 Google 搜索验证后更新状态。" };
  } catch (error) {
    console.error("[BackfillURL] Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0]?.message ?? "Invalid data." };
    }
    return { success: false, message: "回填失败，请稍后重试。" };
  }
}

