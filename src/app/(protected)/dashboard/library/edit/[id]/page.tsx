import React from 'react';
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { LibraryEditor } from "./LibraryEditor";

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // 1. Fetch the article with security check (userId)
    const article = await prisma.trackedArticle.findFirst({
        where: {
            id,
            userId: session.user.id,
        },
    });

    if (!article) {
        notFound();
    }

    return (
        <div className="max-w-7xl mx-auto">
            <LibraryEditor initialArticle={article} />
        </div>
    );
}
