'use client';

import React, { useState } from 'react';
import { syncAllContent } from '@/app/actions/sync';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SyncPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSync = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await syncAllContent();
            setResult(res);
        } catch (error) {
            setResult({ success: false, message: 'Sync failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-20 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Notion 内容同步工具</h1>

            <Card className="p-8">
                <p className="text-brand-text-secondary mb-6">
                    点击下方按钮将从 Notion 数据库拉取所有状态为 <b>Ready</b> 的文章，
                    并自动同步到 Supabase 数据库。图片将被上传到 Supabase Storage。
                </p>

                <div className="flex flex-col gap-4">
                    <Button
                        onClick={handleSync}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-6 text-lg"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">🔄</span>
                                同步中...
                            </>
                        ) : '开始全量同步'}
                    </Button>

                    {result && (
                        <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {result.message}
                        </div>
                    )}
                </div>
            </Card>

            <div className="mt-8 text-sm text-brand-text-muted">
                <h3 className="font-bold mb-2">同步指南：</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>确保文章在 Notion 中的 <b>Status</b> 属性为 <b>Ready</b></li>
                    <li>确保 <b>Slug</b> 属性已填写，否则会导致同步失败</li>
                    <li>同步过程可能需要几分钟（视图片数量而定）</li>
                    <li>同步完成后会更新博客列表和详情页缓存</li>
                </ul>
            </div>
        </div>
    );
}
