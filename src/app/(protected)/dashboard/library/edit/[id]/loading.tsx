import React from 'react';

export default function Loading() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-pulse p-6">
            <div className="flex justify-between items-center">
                <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
                <div className="flex gap-3">
                    <div className="h-10 w-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-10 w-24 bg-slate-900/10 rounded-xl"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-16 w-full bg-white border border-slate-100 rounded-2xl"></div>
                    <div className="h-[600px] w-full bg-white border border-slate-100 rounded-2xl"></div>
                </div>
                <div className="space-y-6">
                    <div className="h-48 w-full bg-white border border-slate-100 rounded-2xl"></div>
                    <div className="h-64 w-full bg-white border border-slate-100 rounded-2xl"></div>
                </div>
            </div>
        </div>
    );
}
