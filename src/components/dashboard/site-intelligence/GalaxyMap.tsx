'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Node {
  id: string;
  name: string;
  val: number;
  color: string;
  type: string;
}

interface Link {
  source: string;
  target: string;
}

interface GalaxyMapProps {
  siteId: string;
  data: { nodes: Node[]; links: Link[] };
  onNodeClick?: (node: any) => void;
  isLoading?: boolean;
}

// Brighten colors for dark background
function toGlowColor(hex: string): string {
  const map: Record<string, string> = {
    '#6366f1': '#818cf8', // indigo → lighter indigo
    '#10b981': '#34d399', // emerald → lighter emerald
    '#f59e0b': '#fbbf24', // amber
    '#ef4444': '#f87171', // red
    '#3b82f6': '#60a5fa', // blue
    '#8b5cf6': '#a78bfa', // violet
    '#06b6d4': '#22d3ee', // cyan
    '#ec4899': '#f472b6', // pink
  };
  return map[hex.toLowerCase()] ?? hex;
}

export default function GalaxyMap({ siteId, data, onNodeClick, isLoading }: GalaxyMapProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [use3D, setUse3D] = useState(false); // default 2D — more legible
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [ghostNodes, setGhostNodes] = useState<any[]>([]);
  const [mergedData, setMergedData] = useState(data);

  // Fetch ghost nodes
  useEffect(() => {
    const fetchGhostNodes = async () => {
      try {
        const res = await fetch(`/api/dashboard/sites/${siteId}/ghost-nodes`);
        const result = await res.json();
        if (result.nodes) setGhostNodes(result.nodes);
      } catch (e) {
        console.error('Failed to fetch ghost nodes:', e);
      }
    };
    if (siteId) fetchGhostNodes();
  }, [siteId]);

  useEffect(() => {
    setMergedData({
      nodes: [...data.nodes, ...ghostNodes],
      links: data.links,
    });
  }, [data, ghostNodes]);

  // Container resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // WebGL detection
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) { setWebGLAvailable(false); setUse3D(false); }
    } catch { setWebGLAvailable(false); setUse3D(false); }
  }, []);

  // Force layout tuning
  useEffect(() => {
    if (!fgRef.current) return;

    const charge = fgRef.current.d3Force('charge');
    if (charge) charge.strength(-120);

    const link = fgRef.current.d3Force('link');
    if (link) link.distance(60);

    const center = fgRef.current.d3Force('center');
    if (center) center.x(0).y(0);

    if (use3D) {
      fgRef.current.cameraPosition?.({ x: 0, y: 0, z: 400 });
    } else {
      fgRef.current.centerAt?.(0, 0);
    }

    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(800, 60);
    }, 1200);
    return () => clearTimeout(timer);
  }, [data, use3D, dimensions]);

  // 2D custom node renderer
  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;
    const isGhost = node.type === 'ghost';
    const isRoot = node.type === 'root';
    const isPillar = node.type === 'pillar';

    const baseColor = isGhost ? '#a78bfa' : toGlowColor(node.color);
    const radius = Math.sqrt(isGhost ? node.val * 0.7 : node.val) * 3.5 + (isRoot ? 4 : isPillar ? 2 : 0);

    // Glow halo
    const glowRadius = radius * (isRoot ? 3.5 : isPillar ? 2.8 : 2.2);
    const grd = ctx.createRadialGradient(node.x, node.y, radius * 0.3, node.x, node.y, glowRadius);
    if (isGhost) {
      grd.addColorStop(0, `${baseColor}55`);
      grd.addColorStop(1, `${baseColor}00`);
    } else if (isRoot) {
      grd.addColorStop(0, `${baseColor}99`);
      grd.addColorStop(0.4, `${baseColor}44`);
      grd.addColorStop(1, `${baseColor}00`);
    } else if (isPillar) {
      grd.addColorStop(0, `${baseColor}77`);
      grd.addColorStop(1, `${baseColor}00`);
    } else {
      grd.addColorStop(0, `${baseColor}44`);
      grd.addColorStop(1, `${baseColor}00`);
    }
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();

    // Core node
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    if (isGhost) {
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = `${baseColor}cc`;
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
      ctx.fillStyle = `${baseColor}33`;
      ctx.fill();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = baseColor;
      ctx.fill();
      // Bright center highlight
      const hl = ctx.createRadialGradient(
        node.x - radius * 0.3, node.y - radius * 0.3, 0,
        node.x, node.y, radius
      );
      hl.addColorStop(0, 'rgba(255,255,255,0.55)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl;
      ctx.fill();
    }

    // Labels: always show for root/pillar; show others when zoomed in
    const showLabel = isRoot || isPillar || globalScale > 1.5;
    if (showLabel) {
      const fontSize = Math.max(9, Math.min(14, (isRoot ? 13 : isPillar ? 11 : 9) / globalScale));
      const weight = isRoot ? '700' : isPillar ? '600' : '400';
      ctx.font = `${weight} ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const label = node.name.length > 28 ? node.name.slice(0, 27) + '…' : node.name;
      const textY = node.y + radius + 3 / globalScale;

      // Text shadow / halo for legibility on dark bg
      ctx.strokeStyle = 'rgba(6,13,31,0.9)';
      ctx.lineWidth = 3 / globalScale;
      ctx.lineJoin = 'round';
      ctx.strokeText(label, node.x, textY);

      ctx.fillStyle = isRoot ? '#f1f5f9' : isPillar ? '#cbd5e1' : '#94a3b8';
      ctx.fillText(label, node.x, textY);

      if (isGhost) {
        const subY = textY + fontSize + 1 / globalScale;
        ctx.font = `italic ${fontSize * 0.85}px Inter, sans-serif`;
        ctx.fillStyle = '#a78bfa99';
        ctx.fillText('gap', node.x, subY);
      }
    }
  };

  const nodePointerAreaPaint = (node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const radius = Math.sqrt(node.val) * 4 + 6;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Custom link renderer: glowing line on dark background
  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start !== 'object' || typeof end !== 'object') return;
    if (!Number.isFinite(start.x) || !Number.isFinite(start.y) || !Number.isFinite(end.x) || !Number.isFinite(end.y)) return;

    ctx.save();
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(99,140,255,0.15)';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Core line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(147,197,253,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] rounded-2xl overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 40% 35%, #0f1a3a 0%, #060d1f 55%, #020408 100%)',
      }}
    >
      {/* Subtle star field overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 72% 14%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 88% 65%, rgba(255,255,255,0.18) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.15) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 90%, rgba(255,255,255,0.12) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 5% 45%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 95% 35%, rgba(255,255,255,0.15) 0%, transparent 100%),
            radial-gradient(1px 1px at 42% 5%, rgba(255,255,255,0.2) 0%, transparent 100%)
          `,
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060d1f]/85 backdrop-blur-sm">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-blue-500/10 border-t-blue-400/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-5 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">正在测绘星图数据...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && mergedData.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="text-4xl opacity-30">🛸</div>
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">输入域名并发起扫描</p>
        </div>
      )}

      {use3D && webGLAvailable ? (
        <ForceGraph3D
          ref={fgRef}
          graphData={mergedData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeLabel="name"
          nodeColor={(node: any) => toGlowColor(node.type === 'ghost' ? '#a78bfa' : node.color)}
          nodeRelSize={6}
          nodeVal={(node: any) => node.type === 'ghost' ? node.val * 0.7 : node.val}
          nodeOpacity={0.9}
          linkWidth={2}
          linkColor={() => 'rgba(147,197,253,0.7)'}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.004}
          linkDirectionalParticleColor={() => 'rgba(200,225,255,0.95)'}
          onNodeClick={onNodeClick}
        />
      ) : (
        <ForceGraph2D
          ref={fgRef}
          graphData={mergedData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeLabel="name"
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={nodePointerAreaPaint}
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.004}
          linkDirectionalParticleColor={() => 'rgba(200,225,255,0.95)'}
          onNodeClick={onNodeClick}
          cooldownTicks={120}
        />
      )}

      {/* Mode toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setUse3D(!use3D)}
          className="px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-600/40 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-500/60 transition-all shadow-lg"
        >
          {use3D ? '2D 模式' : '3D 模式'}
        </button>
      </div>

      {/* Legend */}
      {mergedData.nodes.length > 0 && (
        <div className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-2 bg-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-700/30">
          {[
            { color: '#818cf8', label: '根节点' },
            { color: '#34d399', label: '支柱页' },
            { color: '#60a5fa', label: '内容页' },
            { color: '#a78bfa', label: '内容缺口', dashed: true },
          ].map(({ color, label, dashed }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: dashed ? 'transparent' : color,
                  border: dashed ? `1.5px dashed ${color}` : 'none',
                  boxShadow: dashed ? 'none' : `0 0 6px ${color}88`,
                }}
              />
              <span className="text-[9px] text-slate-500 font-mono tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
