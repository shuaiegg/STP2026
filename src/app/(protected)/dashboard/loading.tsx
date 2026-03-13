import React from 'react';

export default function Loading() {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
                </div>
            </div>

            {/* Core Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 rounded-3xl bg-slate-100 border-2 border-slate-50"></div>
                ))}
            </div>

            {/* Recent Articles Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-slate-50 border-2 border-slate-100"></div>
                ))}
            </div>

            {/* Account Summary Skeleton */}
            <div className="space-y-6">
                <div className="h-8 w-40 bg-slate-200 rounded-md"></div>
                <div className="h-64 rounded-3xl bg-slate-100 border-2 border-slate-50"></div>
            </div>
        </div>
    );
}
