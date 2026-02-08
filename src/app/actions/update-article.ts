'use server'

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  optimizedContent: z.string().min(1).optional(),
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

/**
 * 更新内容资产库中的文章
 */
export async function updateTrackedArticle(input: z.infer<typeof updateArticleSchema>) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, message: "Unauthorized. Please login again." };
    }

    const { id, ...data } = updateArticleSchema.parse(input);

    // 确保只能更新属于自己的文章
    const article = await prisma.trackedArticle.update({
      where: {
        id,
        userId: session.user.id,
      },
      data,
    });

    revalidatePath("/dashboard/library");
    revalidatePath(`/dashboard/library/edit/${id}`);

    return { 
      success: true, 
      message: "文章已成功保存至您的资产库", 
      data: article 
    };
  } catch (error) {
    console.error("[UpdateArticle] Error:", error);
    return { success: false, message: "保存失败，请检查网络或登录状态" };
  }
}
