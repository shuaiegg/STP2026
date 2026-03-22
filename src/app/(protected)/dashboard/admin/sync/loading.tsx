import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminSyncLoading() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            <div>
                <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
                <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
            </div>

            <Card className="p-8 border-none shadow-sm rounded-2xl">
                <div className="flex flex-col items-center justify-center space-y-6 py-12">
                    <div className="w-24 h-24 bg-slate-100 rounded-full"></div>
                    <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
                    <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
                    <div className="h-12 w-40 bg-slate-200 rounded-xl mt-4"></div>
                </div>
            </Card>
        </div>
    );
}
