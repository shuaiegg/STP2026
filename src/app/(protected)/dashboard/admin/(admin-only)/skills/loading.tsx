import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminSkillsLoading() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            <div>
                <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
                <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-6 border-slate-200 shadow-sm rounded-2xl h-48 space-y-4">
                        <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                        <div className="h-4 w-full bg-slate-100 rounded-md"></div>
                        <div className="h-4 w-2/3 bg-slate-100 rounded-md"></div>
                        <div className="h-8 w-24 bg-slate-200 rounded-lg mt-auto"></div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
