'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

const COPY = {
  title: '账单数据加载失败',
  description: '我们在加载你的积分和账单信息时遇到了问题，请尝试刷新页面。',
  retry: '重试',
} as const;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
        <AlertCircle size={32} aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">{COPY.title}</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">{COPY.description}</p>
      </div>
      <Button
        onClick={() => reset()}
        className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6 font-bold flex items-center gap-2"
      >
        <RefreshCcw size={18} aria-hidden="true" />
        {COPY.retry}
      </Button>
    </div>
  );
}
