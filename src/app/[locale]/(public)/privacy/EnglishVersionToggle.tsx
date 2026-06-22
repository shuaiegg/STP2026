'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';

export function EnglishVersionToggle({ content }: { content: string }) {
    const [showEnglish, setShowEnglish] = useState(false);

    return (
        <div className="mt-12">
            <button
                onClick={() => setShowEnglish(!showEnglish)}
                className="w-full flex items-center justify-between p-6 bg-slate-50 border-2 border-brand-border rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all"
            >
                <span className="flex items-center gap-2 uppercase tracking-widest text-xs">
                    <Globe size={16} /> English Version
                </span>
                {showEnglish ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showEnglish && (
                <Card className="mt-4 p-8 border-2 border-brand-border bg-white animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                        {content}
                    </div>
                </Card>
            )}
        </div>
    );
}
