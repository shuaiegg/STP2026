"use client";

import React from 'react';
import Link from 'next/link';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-surface grid-bg-dense selection:bg-brand-secondary selection:text-brand-primary">
      {/* 1. HERO SECTION */}
      <section className="container mx-auto px-6 pt-32 pb-24 relative overflow-hidden">
        <div className="max-w-4xl animate-slide-in-up">
          <Badge variant="muted" className="mb-6 border-brutalist-sm px-4 py-1.5 text-xs uppercase tracking-widest font-black">
            ScaletoTop 2026 / 逻辑驱动数字帝国
          </Badge>
          <h1 className="text-6xl md:text-8xl font-display font-bold leading-[0.9] mb-10 text-brand-primary tracking-tighter">
            为什么 99% 的内容 <br />
            <span className="text-gradient-brand animate-gradient-x italic">都在烧钱？</span>
          </h1>
          <p className="text-xl md:text-2xl text-brand-text-secondary max-w-2xl font-sans leading-relaxed">
            在 AI 泛滥的时代，数量不再是护城河。我们不追求“更多”的内容，
            我们追求 <strong className="text-brand-primary font-bold">“更完整的逻辑”</strong>。
          </p>
        </div>
        
        {/* Decorative Grid Element */}
        <div className="absolute -top-10 -right-20 w-96 h-96 opacity-5 pointer-events-none">
           <div className="w-full h-full border-[20px] border-brand-primary rotate-12"></div>
        </div>
      </section>

      {/* 2. PHILOSOPHY SECTION (Black Bar) */}
      <section className="bg-brand-primary py-32 text-brand-text-inverted border-y-8 border-brand-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-20 items-start">
            <div className="md:w-1/3">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
                内生驱动：<br />
                <span className="text-brand-secondary">我们的公理系统</span>
              </h2>
              <div className="w-20 h-2 bg-brand-secondary"></div>
            </div>
            <div className="md:w-2/3 grid gap-16">
               <div className="stagger-1">
                  <h3 className="text-2xl font-display font-bold mb-4 text-brand-secondary uppercase tracking-widest">01 / 业务 DNA 提取</h3>
                  <p className="text-lg text-brand-text-muted font-sans leading-relaxed">
                    每一个伟大的业务都有其内在的公理系统。我们通过 AI 深度解构您的业务核心、受众痛点与品牌调性，确保内容产出具备天然的商业直觉。
                  </p>
               </div>
               <div className="stagger-2">
                  <h3 className="text-2xl font-display font-bold mb-4 text-brand-secondary uppercase tracking-widest">02 / 语义统治力</h3>
                  <p className="text-lg text-brand-text-muted font-sans leading-relaxed">
                    真正的专业不是覆盖对手的关键词，而是完善您自己的知识体系。当您的内容逻辑严丝合缝，Google 将别无选择，只能将您置于顶端。
                  </p>
               </div>
               <div className="stagger-3">
                  <h3 className="text-2xl font-display font-bold mb-4 text-brand-secondary uppercase tracking-widest">03 / 流量套利雷达</h3>
                  <p className="text-lg text-brand-text-muted font-sans leading-relaxed">
                    用算力替换广告费。精准锁定那些高 CPC 词的自然排名机会，实现降维打击。让每一分广告预算，都为长期的数字资产增值服务。
                  </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TECHNOLOGY SECTION */}
      <section className="py-32 container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
           <div className="order-2 md:order-1">
              <div className="border-brutalist p-2 bg-brand-primary inline-block rotate-1">
                 <div className="bg-brand-surface p-8 border-2 border-brand-primary">
                    <pre className="font-mono text-xs text-brand-text-primary overflow-hidden">
{`{
  "project": "STP2026",
  "engine": "IntelligenceEngine v1.4",
  "strategy": "Internal-Driven",
  "status": "Dominating",
  "goals": [
    "Semantic Integrity",
    "Topical Authority",
    "Zero-Friction Execution"
  ]
}`}
                    </pre>
                 </div>
              </div>
           </div>
           <div className="order-1 md:order-2">
              <h2 className="text-4xl font-display font-bold mb-8">独立演进的架构</h2>
              <p className="text-lg text-brand-text-secondary mb-8 leading-relaxed">
                STP 不仅是一个工具，它是一套可以自我进化、自我监测、自我修正的有机体。
                从 Site Intelligence 的战略侦察到 GEO Writer 的精准执行，我们消灭了从“看到机会”到“交付结果”之间的所有认知负荷。
              </p>
              <ul className="space-y-4 font-bold font-display uppercase tracking-wider text-sm">
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-brand-accent"></span> 3D 集群地图实时审计</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-brand-accent"></span> 语义债自动化度量</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-brand-accent"></span> 人机协同战略看板</li>
              </ul>
           </div>
        </div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="pb-40 container mx-auto px-6 text-center">
        <div className="border-brutalist bg-brand-secondary p-12 md:p-24 relative brutalist-hover">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-primary text-white px-8 py-2 font-display font-bold skew-x-12 uppercase tracking-[0.3em]">
             Take Command
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-10 text-brand-primary">
            准备好接管您的 <br /> 细分市场了吗？
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <Link href="/dashboard/site-intelligence/instant-audit">
              <Button size="lg" className="h-20 px-12 text-xl font-display border-brutalist bg-brand-primary hover:bg-brand-primary-hover">
                一键开启深度审计
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-20 px-12 text-xl font-display border-brutalist bg-white">
                立即免费注册
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* 5. TICKET DECOR */}
      <div className="h-16 bg-brand-primary text-brand-secondary flex items-center justify-center font-mono text-xs font-bold tracking-[0.5em] overflow-hidden whitespace-nowrap">
         STP2026 // LOGIC OVER QUANTITY // SEMANTIC DOMINANCE // ROI MAXIMIZER // INDEPENDENT AGENT // 
      </div>
    </div>
  );
}
