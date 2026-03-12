'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 2D 和 3D 两个版本
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
  data: { nodes: Node[]; links: Link[] };
  onNodeClick?: (node: any) => void;
  isLoading?: boolean;
}

export default function GalaxyMap({ data, onNodeClick, isLoading }: GalaxyMapProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [use3D, setUse3D] = useState(true);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // 监听容器大小变化
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // WebGL 检测与降级逻辑
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL not supported, falling back to 2D.');
        setWebGLAvailable(false);
        setUse3D(false);
      }
    } catch (e) {
      setWebGLAvailable(false);
      setUse3D(false);
    }
  }, []);

  // 优化力导向图布局
  useEffect(() => {
    if (fgRef.current) {
      // 1. 调整互斥力 (charge)，让节点距离更近更紧密
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(-30); // further reduced from -80 to make it very compact
      }

      // 2. 增加中心引力，强制重心在 (0,0)
      const centerForce = fgRef.current.d3Force('center');
      if (centerForce) {
        centerForce.x(0).y(0);
      }

      // 3. 强制视图居中
      if (use3D) {
        if (fgRef.current?.cameraPosition) {
          fgRef.current.cameraPosition({ x: 0, y: 0, z: 500 });
        }
      } else {
        if (fgRef.current?.centerAt) {
          fgRef.current.centerAt(0, 0);
        }
      }

      // 4. 定时触发自适应缩放
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(600, 100);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [data, use3D, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-[600px] bg-slate-50 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f8fafc_100%)] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-12 h-12 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-mono text-slate-500 uppercase tracking-widest">正在测绘星图数据...</p>
        </div>
      )}

      {/* 渲染引擎选择 */}
      {use3D && webGLAvailable ? (
        <ForceGraph3D
          ref={fgRef}
          graphData={data}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)" // 透明背景以显示 CSS 渐变
          nodeLabel="name"
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.val}
          linkWidth={2.5} // Increased from 1.5
          linkColor={() => 'rgba(148, 163, 184, 0.7)'} // Darker and more opaque for visibility
          onNodeClick={onNodeClick}
        />
      ) : (
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeLabel="name"
          nodeColor={(node: any) => node.color}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false);

            if (node.type === 'ghost') {
              ctx.setLineDash([2, 1]);
              ctx.strokeStyle = node.color;
              ctx.lineWidth = 1 / globalScale;
              ctx.stroke();
              ctx.fillStyle = `${node.color}33`; // 20% opacity fill
              ctx.fill();
              ctx.setLineDash([]);
            } else {
              ctx.fillStyle = node.color;
              // Pillar nodes get a slight glow
              if (node.type === 'pillar') {
                ctx.shadowBlur = 15 / globalScale;
                ctx.shadowColor = node.color;
              }
              ctx.fill();
              ctx.shadowBlur = 0;
            }

            // 只有在放大时才显示文字
            if (globalScale > 2) {
              const weight = node.type === 'root' || node.type === 'pillar' ? 'bold' : 'normal';
              ctx.font = `${weight} ${fontSize}px Inter`;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // Dark slate for text on light background
              ctx.fillText(label, node.x, node.y + node.val);

              if (node.type === 'ghost') {
                ctx.fillStyle = node.color;
                ctx.font = `italic ${fontSize * 0.8}px Inter`;
                ctx.fillText('(Market Gap)', node.x, node.y + node.val + (fontSize * 1.2));
              }
            }
          }}
          linkWidth={2.5}
          linkColor={() => 'rgba(148, 163, 184, 0.7)'}
          onNodeClick={onNodeClick}
          cooldownTicks={100}
        />
      )}

      {/* 模式切换按钮 */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setUse3D(!use3D)}
          className="px-4 py-1.5 bg-slate-900 border border-slate-700/50 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all shadow-lg"
        >
          {use3D ? '2D 模式' : '3D 模式'}
        </button>
      </div>
    </div>
  );
}
