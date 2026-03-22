import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminCreditRefundLoading() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            <div>
                <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
                <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
            </div>

            <Card className="p-6 border-slate-200 shadow-sm rounded-2xl space-y-6">
                <div className="h-10 w-full md:w-1/2 bg-slate-200 rounded-xl"></div>
                
                <div className="space-y-4">
                    <div className="h-24 w-full bg-slate-50 rounded-xl"></div>
                    <div className="h-40 w-full bg-slate-50 rounded-xl"></div>
                </div>
                
                <div className="h-12 w-32 bg-slate-200 rounded-xl"></div>
            </Card>
        </div>
    );
}
