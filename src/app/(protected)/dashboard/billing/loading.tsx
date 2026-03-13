import React from 'react';

export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-pulse p-6">
            <div className="space-y-4">
                <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
                <div className="h-4 w-80 bg-slate-100 rounded-md"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-white border border-slate-100 rounded-3xl"></div>
                ))}
            </div>

            <div className="h-96 w-full bg-white border border-slate-100 rounded-3xl"></div>
        </div>
    );
}
