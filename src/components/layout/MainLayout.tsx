"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/Button';

const NavIcon: React.FC<{ type: 'home' | 'blog' | 'course' | 'tools' }> = ({ type }) => {
    switch (type) {
        case 'home':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
            );
        case 'blog':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
            );
        case 'course':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path>
                </svg>
            );
        case 'tools':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
            );
        default:
            return null;
    }
};

const Header: React.FC = () => {
    const pathname = usePathname();

    const getLinkClass = (href: string) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return `flex items-center group text-sm font-semibold transition-all py-2 ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-brand-primary'}`;
    };

    return (
        <header className="sticky top-0 z-50 glass-effect border-b border-brand-border/50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-16">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 transition-transform group-hover:rotate-6">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 48 48">
                                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-brand-text-primary">ScaletoTop</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/" className={getLinkClass('/')}>
                            <NavIcon type="home" />
                            首页
                        </Link>
                        <Link href="/blog" className={getLinkClass('/blog')}>
                            <NavIcon type="blog" />
                            博客文章
                        </Link>
                        <Link href="/course" className={getLinkClass('/course')}>
                            <NavIcon type="course" />
                            实战课程
                        </Link>
                        <Link href="/tools" className={getLinkClass('/tools')}>
                            <NavIcon type="tools" />
                            效率工具
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs uppercase tracking-widest font-bold">登录</Button>
                    <Button variant="gradient" size="sm" className="text-xs uppercase tracking-widest font-bold">加入简报</Button>
                </div>
            </div>
        </header>
    );
};

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-50 border-t border-brand-border py-24">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-20">
                    <div className="max-w-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 48 48">
                                    <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" />
                                </svg>
                            </div>
                            <span className="text-base font-bold tracking-tight text-brand-text-primary">ScaletoTop</span>
                        </div>
                        <p className="text-brand-text-secondary text-base leading-relaxed mb-8">
                            引领数字营销的工程化革命。通过技术深度驱动持续、可量化的业务增长。
                        </p>
                        <div className="flex gap-5">
                            <a href="#" className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-primary hover:border-brand-primary transition-all">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-primary hover:border-brand-primary transition-all">
                                <span className="sr-only">GitHub</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            </a>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-20">
                        <div>
                            <h5 className="text-brand-text-primary font-bold text-sm mb-8 tracking-widest uppercase">产品服务</h5>
                            <ul className="space-y-4 text-sm text-brand-text-secondary">
                                <li><Link href="/course" className="hover:text-brand-primary transition-colors">技术型 SEO 课程</Link></li>
                                <li><Link href="/tools" className="hover:text-brand-primary transition-colors">pSEO 自动化工具</Link></li>
                                <li><Link href="#" className="hover:text-brand-primary transition-colors">增长咨询服务</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-brand-text-primary font-bold text-sm mb-8 tracking-widest uppercase">知识库</h5>
                            <ul className="space-y-4 text-sm text-brand-text-secondary">
                                <li><Link href="/blog" className="hover:text-brand-primary transition-colors">最新文章</Link></li>
                                <li><Link href="#" className="hover:text-brand-primary transition-colors">案例拆解</Link></li>
                                <li><Link href="#" className="hover:text-brand-primary transition-colors">技术文档</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-brand-text-primary font-bold text-sm mb-8 tracking-widest uppercase">关于</h5>
                            <ul className="space-y-4 text-sm text-brand-text-secondary">
                                <li><Link href="#" className="hover:text-brand-primary transition-colors">隐私声明</Link></li>
                                <li><Link href="#" className="hover:text-brand-primary transition-colors">服务条款</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-24 pt-10 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                        © 2024 ScaletoTop Engineering. Built for high-growth teams.
                    </p>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                        <Link href="#" className="hover:text-brand-primary">Status</Link>
                        <Link href="#" className="hover:text-brand-primary">Contact</Link>
                        <Link href="#" className="hover:text-brand-primary">English</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
};
