'use server'

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteTrackedArticle(id: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    await prisma.trackedArticle.delete({
        where: {
            id,
            userId: session.user.id,
        },
    });

    revalidatePath("/dashboard/library");
    revalidatePath("/dashboard");
    return { success: true };
}
