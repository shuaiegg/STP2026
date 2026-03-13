import React from 'react';

export default function Loading() {
    return (
        <div className="space-y-10 animate-pulse p-6">
            <div className="space-y-4 text-center max-w-2xl mx-auto">
                <div className="h-12 w-80 bg-slate-200 rounded-lg mx-auto"></div>
                <div className="h-4 w-96 bg-slate-100 rounded-md mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 bg-white border border-slate-100 rounded-3xl p-8 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
                            <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                            <div className="h-4 w-48 bg-slate-50 rounded-md"></div>
                        </div>
                        <div className="h-10 w-full bg-slate-50 rounded-xl"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
