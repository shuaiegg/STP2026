import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminLoading() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
                    <div className="h-4 w-96 bg-slate-100 rounded-md"></div>
                </div>
                <div className="h-8 w-32 bg-slate-50 rounded-full border border-slate-100"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6 border-none shadow-sm bg-white overflow-hidden relative rounded-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100"></div>
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-slate-100 rounded-md"></div>
                                <div className="h-8 w-16 bg-slate-200 rounded-md"></div>
                            </div>
                        </div>
                        <div className="h-3 w-32 bg-slate-100 rounded-md mt-4"></div>
                    </Card>
                ))}
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-white min-h-[400px] rounded-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                            <div className="h-4 w-16 bg-slate-100 rounded-md"></div>
                        </div>
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="h-48 w-full bg-slate-50 rounded-xl"></div>
                        </div>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-slate-100 border-slate-200 min-h-[160px] rounded-2xl"><div /></Card>
                    <Card className="p-8 border-none shadow-sm bg-white min-h-[160px] rounded-2xl">
                        <div className="h-6 w-24 bg-slate-200 rounded-md mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
                                    <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
