import Link from 'next/link';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const COPY = {
  badge: 'ScaletoTop · 关于我们',
  heroHeadline: '为什么 99% 的内容都在烧钱？',
  heroHighlight: '在结果面前，数量从不是护城河。',
  heroDescription: '在 AI 泛滥的时代，我们不追求"更多"的内容，我们追求更完整的逻辑。让每一篇内容都成为可量化的资产，而不是沉没成本。',
  philosophyLabel: '我们的方法论',
  philosophyHeadline: '内生驱动：用业务逻辑统治语义',
  principles: [
    {
      number: '01',
      title: '业务 DNA 提取',
      description: '每一个伟大的业务都有其内在的公理系统。我们通过 AI 深度解构你的业务核心、受众痛点与品牌调性，确保内容产出具备天然的商业直觉。',
    },
    {
      number: '02',
      title: '语义统治力',
      description: '真正的专业不是覆盖对手的关键词，而是完善自己的知识体系。当内容逻辑严丝合缝，搜索引擎将别无选择，只能将你置于顶端。',
    },
    {
      number: '03',
      title: '流量套利雷达',
      description: '用算力替换广告费。精准锁定高 CPC 词的自然排名机会，实现降维打击。让每一分预算，都为长期的数字资产增值服务。',
    },
  ],
  statsLabel: '截至 2026 年 3 月',
  stats: [
    { value: '10,000+', label: '分析站点数' },
    { value: '2.4M+', label: '追踪关键词' },
    { value: '98%', label: '构建成功率' },
  ],
  techLabel: '平台架构',
  techHeadline: '独立演进的 SEO 操作系统',
  techDescription: 'STP 不只是工具集，它是一套可以自我监测、自我修正的有机系统。从 Site Intelligence 的战略侦察到 GEO Writer 的精准执行，消灭了从"看到机会"到"交付结果"之间的所有认知负荷。',
  techFeatures: [
    '站点健康度实时审计',
    '语义债自动化度量',
    '人机协同战略看板',
    'GEO 内容被引用追踪',
  ],
  ctaHeadline: '准备好让你的内容为你工作了吗？',
  ctaDescription: '分析你的站点，找出被搜索引擎忽略的内容缺口。免费开始，无需信用卡。',
  ctaPrimary: '免费分析我的网站',
  ctaSecondary: '查看定价',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl animate-slide-in-up">
          <Badge variant="muted" className="mb-6">{COPY.badge}</Badge>
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight mb-6 text-brand-text-primary tracking-tight">
            {COPY.heroHeadline}
          </h1>
          <p className="text-xl text-brand-secondary font-semibold mb-4">{COPY.heroHighlight}</p>
          <p className="text-lg text-brand-text-secondary leading-relaxed max-w-2xl">
            {COPY.heroDescription}
          </p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-brand-border bg-brand-surface">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs font-mono text-brand-text-muted uppercase tracking-widest mb-8">{COPY.statsLabel}</p>
          <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-lg">
            {COPY.stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-mono font-bold text-brand-text-primary">{stat.value}</div>
                <div className="text-xs text-brand-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-mono text-brand-secondary uppercase tracking-widest mb-3">{COPY.philosophyLabel}</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-text-primary tracking-tight max-w-xl">
            {COPY.philosophyHeadline}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {COPY.principles.map((p) => (
            <div key={p.number} className="border border-brand-border rounded-lg p-8 bg-white hover:shadow-md transition-shadow">
              <div className="text-4xl font-mono font-bold text-brand-border mb-6">{p.number}</div>
              <h3 className="text-lg font-display font-bold text-brand-text-primary mb-3">{p.title}</h3>
              <p className="text-brand-text-secondary leading-relaxed text-sm">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECHNOLOGY ── */}
      <section className="bg-brand-primary">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono text-brand-secondary uppercase tracking-widest mb-4">{COPY.techLabel}</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-6">
                {COPY.techHeadline}
              </h2>
              <p className="text-brand-text-muted leading-relaxed mb-10">
                {COPY.techDescription}
              </p>
              <ul className="space-y-3">
                {COPY.techFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-8 font-mono text-sm text-brand-text-muted">
              <pre className="overflow-hidden leading-relaxed">
{`{
  "platform": "ScaletoTop",
  "version": "2026",
  "engine": "IntelligenceEngine",
  "strategy": "Internal-Driven",
  "goals": [
    "Semantic Integrity",
    "Topical Authority",
    "Zero-Friction Execution"
  ],
  "status": "Active"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-12 md:p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-text-primary mb-4 tracking-tight">
            {COPY.ctaHeadline}
          </h2>
          <p className="text-brand-text-secondary mb-10 leading-relaxed">
            {COPY.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard/site-intelligence/instant-audit">
              <Button size="lg">{COPY.ctaPrimary}</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">{COPY.ctaSecondary}</Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
