"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { MOCK_POSTS } from '@/constants';

export default function PreviewPage() {
    const params = useParams();
    const token = params.token as string;
    // Mocking preview logic: just show the first post
    const post = MOCK_POSTS[0];

    return (
        <div>
            <div className="bg-brand-warning text-brand-text-primary py-2 px-6 text-center text-xs font-bold tracking-widest uppercase">
                预览模式 - 此内容尚未正式发布 (TOKEN: {token})
            </div>
            <div className="opacity-75">
                <article className="max-w-3xl mx-auto px-6 py-20">
                    <h1 className="text-5xl font-bold mb-8">{post.title} (预览版)</h1>
                    <div className="prose text-brand-text-secondary leading-relaxed">
                        <p>{post.excerpt}</p>
                        <p>内容正在渲染中...</p>
                    </div>
                </article>
            </div>
        </div>
    );
}
