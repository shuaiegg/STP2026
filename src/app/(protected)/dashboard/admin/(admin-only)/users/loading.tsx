import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminUsersLoading() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            <div>
                <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
                <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
            </div>
            
            <div className="flex gap-4">
                <div className="h-10 w-64 bg-slate-200 rounded-xl"></div>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6">
                <div className="h-8 w-full bg-slate-50 mb-4 rounded-md"></div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                                    <div className="h-3 w-48 bg-slate-100 rounded-md"></div>
                                </div>
                            </div>
                            <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
