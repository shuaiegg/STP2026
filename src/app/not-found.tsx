import Link from 'next/link';
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-surface grid-bg flex flex-col items-center justify-center px-6 selection:bg-brand-secondary selection:text-brand-primary">
      {/* Technical Error Code */}
      <div className="mb-8 animate-slide-in-up stagger-1">
        <span className="font-mono text-sm font-bold bg-brand-primary text-brand-secondary px-3 py-1 uppercase tracking-[0.3em]">
          Error: 404 // Routing Failure
        </span>
      </div>

      {/* Main Heading */}
      <div className="text-center mb-12 animate-slide-in-up stagger-2">
        <h1 className="text-[12rem] md:text-[18rem] font-display font-black leading-none text-brand-primary tracking-tighter opacity-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          404
        </h1>
        <h2 className="text-4xl md:text-6xl font-display font-bold text-brand-primary relative z-10 leading-tight">
          语义孤岛检测中... <br />
          <span className="text-gradient-accent italic">目标路径不存在</span>
        </h2>
      </div>

      {/* Description */}
      <p className="text-lg md:text-xl text-brand-text-secondary max-w-lg text-center font-sans mb-12 animate-slide-in-up stagger-3 leading-relaxed">
        看来您请求的节点尚未在我们的知识图谱中建立连接。
        可能是因为该路径已被重构，或者它本就是一个“语义债”空位。
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-6 animate-slide-in-up stagger-4 relative z-10">
        <Link href="/">
          <Button size="lg" className="h-16 px-10 text-lg font-display border-brutalist bg-brand-primary hover:bg-brand-primary-hover brutalist-hover">
            返回战略指挥部 (首页)
          </Button>
        </Link>
        <Link href="/blog">
          <Button variant="outline" size="lg" className="h-16 px-10 text-lg font-display border-brutalist bg-white brutalist-hover">
            探索知识库
          </Button>
        </Link>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center opacity-30 font-mono text-[10px] tracking-widest uppercase">
        <span>STP2026 // System-Internal-Router</span>
        <span className="hidden md:block">Topical Dominance: 0% at current path</span>
        <span>Build: Mar-2026</span>
      </div>
    </div>
  );
}
