import type { Metadata } from 'next';
import { ConsultationForm } from './ConsultationForm';

export const metadata: Metadata = {
  title: '免费咨询 — ScaletoTop',
  description: '告诉我们你的出海业务目标，获取定制化的 SEO + 内容 + GEO 增长方案',
  alternates: { canonical: 'https://scaletotop.com/consultation' },
};

const COPY = {
  badge: '免费咨询',
  title: '让你的出海业务被更多人看见',
  sub: '填写下方表单，我们会在 1 个工作日内根据你的具体情况给出定制建议',
  trustLine: '已服务 50+ 出海品牌 · 响应时间 < 24h · 无套路销售',
} as const;

export default function ConsultationPage() {
  return (
    <main className="min-h-screen bg-brand-bg">
      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full mb-4">
            {COPY.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-brand-text-primary mb-4 leading-tight">
            {COPY.title}
          </h1>
          <p className="text-brand-text-secondary max-w-lg mx-auto leading-relaxed">{COPY.sub}</p>
          <p className="mt-4 text-xs text-brand-text-muted">{COPY.trustLine}</p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConsultationForm />
        </div>
      </section>
    </main>
  );
}
