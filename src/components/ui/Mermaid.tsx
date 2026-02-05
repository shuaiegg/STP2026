"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
});

interface MermaidProps {
    chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderChart = async () => {
            if (!ref.current || !chart) return;

            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                // Attempt to render
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (err: any) {
                console.error('Mermaid render error:', err);
                setError('Failed to render chart');
                // Mermaid might wipe content on error, so we preserve raw code
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-500 text-xs font-mono">
                {error}
                <pre className="mt-2 text-slate-500">{chart}</pre>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="mermaid-container my-8 flex justify-center bg-slate-50/50 p-6 rounded-xl border border-slate-100"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
