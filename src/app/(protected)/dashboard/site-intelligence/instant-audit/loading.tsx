import React from 'react';

export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse p-6">
            <div className="space-y-4">
                <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
                <div className="h-4 w-96 bg-slate-100 rounded-md"></div>
            </div>

            <div className="h-64 w-full bg-white border-2 border-slate-100 rounded-3xl p-8">
                <div className="space-y-6">
                    <div className="h-12 w-full bg-slate-50 rounded-xl"></div>
                    <div className="h-12 w-full bg-slate-900/10 rounded-xl"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 bg-slate-50 rounded-2xl border border-slate-100"></div>
                <div className="h-48 bg-slate-50 rounded-2xl border border-slate-100"></div>
            </div>
        </div>
    );
}
