import React from 'react';
import Link from 'next/link';

export default function Tools() {
    return (
        <div className="container mx-auto py-20 text-center min-h-[60vh] px-6">
            <h1 className="font-display text-4xl font-black mb-4 text-brand-text-primary">数字化工具包</h1>
            <p className="text-brand-text-secondary mb-16 max-w-2xl mx-auto">
                为 B2B 出海企业打造的自动化效率工具，助力每一个决策都可量化、可追踪。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Tool 1: SEO & GEO Content Generator */}
                <div className="group relative">
                    <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer h-full text-left">
                        <div className="w-12 h-12 bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center text-brand-primary mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-3 text-brand-text-primary">SEO & GEO 写作优化器</h2>
                        <p className="text-brand-text-secondary text-sm mb-6 leading-relaxed">
                            基于 Google 地图数据与本地 SEO 算法，一键生成针对特定地理位置的高转化 B2B 文案。
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-brand-secondary uppercase bg-brand-secondary/10 px-2 py-1">即将上线</span>
                            <span className="text-xs font-bold text-brand-text-muted">10 积分 / 次</span>
                        </div>
                    </div>
                </div>

                {/* Tool 2: Google Maps Leads Scraper */}
                <div className="group relative">
                    <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer h-full text-left">
                        <div className="w-12 h-12 bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-3 text-brand-text-primary">Google Maps 潜在客户采集</h2>
                        <p className="text-brand-text-secondary text-sm mb-6 leading-relaxed">
                            深度采集全球各地区的 B2B 客户信息，包含电话、网站、社交媒体及地理位置。
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1">Beta 测试中</span>
                            <span className="text-xs font-bold text-brand-text-muted">50 积分 / 次</span>
                        </div>
                    </div>
                </div>

                {/* Tool 3: Site Health Audit */}
                <div className="group relative">
                    <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer h-full text-left">
                        <div className="w-12 h-12 bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-amber-600 mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-3 text-brand-text-primary">出海独立站健康诊断</h2>
                        <p className="text-brand-text-secondary text-sm mb-6 leading-relaxed">
                            全方位扫描独立站的加载速度、SEO 基准、以及移动端适配情况，并提供优化方案。
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-1">深度研发中</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
