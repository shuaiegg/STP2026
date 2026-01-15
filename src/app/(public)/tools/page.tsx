import React from 'react';
import Link from 'next/link';

export default function Tools() {
    return (
        <div className="container mx-auto py-20 text-center min-h-[60vh]">
            <h1 className="text-3xl font-bold mb-8">数字化工具包</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Link href="/admin/sync" className="p-8 border rounded-xl hover:border-brand-primary hover:shadow-lg transition-all">
                    <h2 className="text-xl font-bold mb-2">Notion 内容同步</h2>
                    <p className="text-brand-text-secondary text-sm">将 Notion 数据库中的文章同步到网站数据库</p>
                </Link>
                <div className="p-8 border rounded-xl bg-slate-50 opacity-60">
                    <h2 className="text-xl font-bold mb-2">更多工具</h2>
                    <p className="text-brand-text-secondary text-sm">开发中...</p>
                </div>
            </div>
        </div>
    );
}
