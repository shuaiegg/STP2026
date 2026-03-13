import React from 'react';

export default function Loading() {
    return (
        <div className="p-6 space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                        <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                    </div>
                    <div className="h-4 w-80 bg-slate-100 rounded-md"></div>
                </div>
                <div className="h-10 w-32 bg-slate-900/10 rounded-xl"></div>
            </div>

            {/* Sites Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-56 rounded-2xl bg-slate-100 border border-slate-200"></div>
                ))}
            </div>
        </div>
    );
}
