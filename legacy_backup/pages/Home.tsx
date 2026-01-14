
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MOCK_POSTS } from '../constants';
import { Badge } from '../components/ui/Badge';
import { CTA } from '../components/CTA';

export const Home: React.FC = () => {
  const featuredPosts = MOCK_POSTS.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 md:pt-40 md:pb-52 border-b border-brand-border bg-white">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-primary/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-brand-secondary/10 rounded-full blur-[100px]"></div>
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="default" className="mb-8 px-4 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              Future of Digital Growth
            </Badge>
            <h1 className="text-5xl md:text-8xl font-bold text-brand-text-primary tracking-tighter leading-[0.95] mb-10">
              重塑增长的<br />
              <span className="text-gradient-brand">工程学范式</span>
            </h1>
            <p className="text-xl md:text-2xl text-brand-text-secondary leading-relaxed mb-12 max-w-2xl mx-auto">
              ScaletoTop 助力企业通过深度技术审计、程序化 SEO 与数据闭环，构建不可撼动的数字化增长壁垒。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link to="/blog">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto text-lg">开始探索</Button>
              </Link>
              <Link to="/course">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg glass-effect">查看实战框架</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Value Proposition */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover flex items-center justify-center text-white mb-8 shadow-lg shadow-brand-primary/20 transition-transform group-hover:-translate-y-1">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-brand-text-primary mb-4">底层技术审计</h3>
              <p className="text-brand-text-secondary leading-relaxed text-lg">
                深入现代 JS 框架的渲染链路，解决 Next.js/React 应用在 SEO 性能与收录层面的工程挑战。
              </p>
            </div>
            <div className="group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-secondary to-cyan-600 flex items-center justify-center text-white mb-8 shadow-lg shadow-brand-secondary/20 transition-transform group-hover:-translate-y-1">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-brand-text-primary mb-4">程序化增长 (pSEO)</h3>
              <p className="text-brand-text-secondary leading-relaxed text-lg">
                从结构化数据定义到全自动化页面生成流程，通过工程手段实现内容产出的指数级规模化。
              </p>
            </div>
            <div className="group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white mb-8 shadow-lg shadow-slate-900/20 transition-transform group-hover:-translate-y-1">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-brand-text-primary mb-4">数据驱动闭环</h3>
              <p className="text-brand-text-secondary leading-relaxed text-lg">
                构建从流量获取到业务转化的全链路归因模型，让每一分营销预算都有迹可循。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Content Grid */}
      <section className="py-32 bg-brand-surface relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-[2px] bg-brand-primary"></div>
                <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-brand-primary">深度见解 / DEEP INSIGHTS</h2>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-brand-text-primary tracking-tight leading-tight">
                解构复杂系统中的<br />增长逻辑
              </p>
            </div>
            <Link to="/blog">
              <Button variant="outline" className="glass-effect group">
                浏览全部档案
                <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredPosts.map(post => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group block">
                <Card className="h-full border-0 bg-white/50 hover:bg-white shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 overflow-hidden ring-1 ring-slate-200/50">
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:rotate-1"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="p-8">
                    <Badge variant="muted" className="mb-6 bg-slate-100 text-slate-600 border-0">{post.category}</Badge>
                    <h3 className="text-2xl font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors mb-4 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-brand-text-secondary text-base line-clamp-2 leading-relaxed mb-8 opacity-80">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest pt-6 border-t border-slate-100">
                      <span>{post.publishedAt}</span>
                      <span className="w-1.5 h-1.5 bg-brand-secondary/40 rounded-full"></span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Newsletter */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-12 md:p-24">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-brand opacity-20 blur-3xl -rotate-12 translate-x-1/2"></div>
            
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
                获取专为<span className="text-brand-secondary">增长专家</span>准备的深度周报
              </h2>
              <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed">
                每周为您剖析 2-3 个技术驱动的增长案例，涵盖 SEO 工程化、自动化流程与数据洞察。
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-lg">
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white/15 transition-all"
                />
                <Button variant="gradient" size="lg" className="shadow-none">立即订阅</Button>
              </form>
              <p className="mt-6 text-sm text-slate-500">
                已有 5,000+ 工程与营销专家加入。拒绝垃圾邮件，随时取消。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
