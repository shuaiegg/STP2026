'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface AuditScoreSparklineProps {
    audits: { techScore: number; createdAt: string }[];
}

export function AuditScoreSparkline({ audits }: AuditScoreSparklineProps) {
    // Need at least 3 audits to show sparkline
    if (!audits || audits.length < 3) return null;

    // Reverse so oldest is first (chronological order)
    const sortedAudits = [...audits].reverse();
    const data = sortedAudits.map((a, i) => ({
        index: i,
        score: a.techScore || 0,
    }));

    // Determine line color: compare latest vs previous
    const latestScore = data[data.length - 1].score;
    const previousScore = data[data.length - 2].score;
    const lineColor = latestScore >= previousScore ? '#10b981' : '#ef4444';

    return (
        <div className="relative w-full h-[40px]">
            <ResponsiveContainer width="100%" height={40}>
                <LineChart data={data}>
                    <YAxis domain={[0, 100]} hide />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke={lineColor}
                        strokeWidth={2}
                        dot={(props: any) => {
                            const { cx, cy, index } = props;
                            const isLast = index === data.length - 1;
                            if (isLast) {
                                return (
                                    <g key={`dot-${index}`}>
                                        <circle cx={cx} cy={cy} r={4} fill={lineColor} stroke="white" strokeWidth={2} />
                                    </g>
                                );
                            }
                            return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
            {/* Score label at the latest point */}
            <div
                className="absolute right-0 top-0 text-[10px] font-black"
                style={{ color: lineColor }}
            >
                {latestScore}
            </div>
        </div>
    );
}
