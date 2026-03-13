import React from 'react';

export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-pulse p-6">
            <div className="space-y-4">
                <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
                <div className="h-4 w-72 bg-slate-100 rounded-md"></div>
            </div>

            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-white border border-slate-100 rounded-3xl p-8 space-y-4">
                        <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                        <div className="h-12 w-full bg-slate-50 rounded-xl"></div>
                        <div className="h-12 w-full bg-slate-50 rounded-xl"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
