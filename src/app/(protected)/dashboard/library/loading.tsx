import React from 'react';

export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-3">
                    <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-72 bg-slate-100 rounded-md"></div>
                </div>
            </div>

            {/* Filters Skeleton */}
            <div className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-40 bg-slate-50 rounded-xl"></div>
                ))}
            </div>

            {/* Table/List Skeleton */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 bg-white border-2 border-slate-50 rounded-2xl"></div>
                ))}
            </div>
        </div>
    );
}
