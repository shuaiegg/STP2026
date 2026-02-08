'use server'

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

const saveArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  optimizedContent: z.string().min(1, "Content is required"),
  contentHtml: z.string().optional(),
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
    const article = await prisma.trackedArticle.create({
      data: {
        userId: session.user.id,
        title: validated.title,
        summary: validated.summary,
        keywords: validated.keywords,
        optimizedContent: validated.optimizedContent,
        contentHtml: validated.contentHtml,
        status: "PENDING",
      },
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
