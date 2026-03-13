import React from 'react';

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-4 border-b border-slate-100">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-24 bg-slate-100 rounded-t-lg"></div>
                ))}
            </div>

            {/* Content Card Skeleton */}
            <div className="h-96 w-full bg-slate-50 rounded-2xl border-2 border-slate-100"></div>

            {/* Summary Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
                ))}
            </div>
        </div>
    );
}
