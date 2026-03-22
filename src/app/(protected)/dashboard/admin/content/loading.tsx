import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminContentLoading() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
                    <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-4">
                <div className="h-10 w-64 bg-slate-200 rounded-xl"></div>
                <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
            </div>

            {/* Content List */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                            <div className="space-y-2">
                                <div className="h-5 w-64 bg-slate-200 rounded-md"></div>
                                <div className="h-3 w-32 bg-slate-100 rounded-md"></div>
                            </div>
                        </div>
                        <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
                    </div>
                ))}
            </Card>
        </div>
    );
}
