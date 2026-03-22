import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminContentEditLoading() {
    return (
        <div className="space-y-6 animate-pulse max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
            </div>

            <Card className="p-8 border-none shadow-sm space-y-8 rounded-2xl">
                {/* Title */}
                <div className="space-y-2">
                    <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
                    <div className="h-12 w-full bg-slate-100 rounded-xl"></div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                    <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
                    <div className="h-32 w-full bg-slate-100 rounded-xl"></div>
                </div>

                {/* Cover Picker */}
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
                    <div className="h-48 w-full bg-slate-100 rounded-xl"></div>
                </div>
            </Card>
        </div>
    );
}
