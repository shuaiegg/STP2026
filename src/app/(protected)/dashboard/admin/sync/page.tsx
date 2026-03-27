'use client';

import React, { useState } from 'react';
import { syncAllContent } from '@/app/actions/sync';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader2, RefreshCw } from 'lucide-react';

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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text-primary mb-2 font-display">Notion 内容同步工具</h1>
                    <p className="text-brand-text-secondary">从 Notion 数据库拉取 Ready 状态的内容并同步至平台。</p>
                </div>
            </div>

            <Card className="p-8 border-none shadow-sm bg-brand-surface max-w-2xl">
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
                                <Loader2 size={20} className="animate-spin" />
                                同步中...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={20} />
                                开始全量同步
                            </>
                        )}
                    </Button>

                    {result && (
                        <div className={`p-4 rounded-lg border ${result.success ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' : 'bg-brand-error/10 border-brand-error/20 text-brand-error'}`}>
                            {result.message}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-sm text-brand-text-muted">
                    <h3 className="font-bold mb-2">同步指南：</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>确保文章在 Notion 中的 <b>Status</b> 属性为 <b>Ready</b></li>
                        <li>确保 <b>Slug</b> 属性已填写，否则会导致同步失败</li>
                        <li>同步过程可能需要几分钟（视图片数量而定）</li>
                        <li>同步完成后会更新博客列表和详情页缓存</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
}
