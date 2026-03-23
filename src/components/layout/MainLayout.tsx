"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { authClient } from '@/lib/auth-client';

const NAV_ITEMS = [
    { href: '/', label: '首页', icon: 'home' as const },
    { href: '/blog', label: '博客文章', icon: 'blog' as const },
    { href: '/tools', label: '效率工具', icon: 'tools' as const },
    { href: '/pricing', label: '定价方案', icon: 'pricing' as const },
    { href: '/about', label: '关于我们', icon: 'about' as const }
];

const FOOTER_LINKS = [
    {
        title: '产品服务',
        links: [
            { label: '技术型 SEO 课程 (即将上线)', href: '#', disabled: true },
            { label: 'pSEO 自动化工具', href: '/tools', disabled: false },
            { label: '定价方案', href: '/pricing', disabled: false },
            { label: '增长咨询服务 (预约已满)', href: '#', disabled: true }
        ]
    },
    {
        title: '知识库',
        links: [
            { label: '最新文章', href: '/blog', disabled: false },
            { label: '案例拆解', href: '/case-studies', disabled: false },
            { label: '联系我们', href: '/contact', disabled: false }
        ]
    },
    {
        title: '关于',
        links: [
            { label: '关于 STP2026', href: '/about', disabled: false },
            { label: '隐私声明', href: '/privacy', disabled: false },
            { label: '服务条款', href: '/terms', disabled: false },
            { label: '退款政策', href: '/refund', disabled: false }
        ]
    }
];

const NavIcon: React.FC<{ type: 'home' | 'blog' | 'tools' | 'pricing' | 'about' }> = ({ type }) => {
    switch (type) {
        case 'home':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
            );
        case 'about':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            );
        case 'blog':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
            );
        case 'tools':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
            );
        case 'pricing':
            return (
                <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                </svg>
            );
        default:
            return null;
    }
};

const Header: React.FC = () => {
    const pathname = usePathname();
    const { data: session } = authClient.useSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await authClient.signOut();
        window.location.href = '/';
    };

    const getLinkClass = (href: string) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return `flex items-center group text-sm font-semibold transition-all py-2 px-3 rounded-lg ${isActive ? 'text-brand-secondary bg-brand-secondary/10' : 'text-brand-text-secondary hover:text-brand-primary hover:bg-brand-surface'}`;
    };

    return (
        <header className="sticky top-0 z-50 glass-effect border-b border-brand-border/50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-16">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 transition-transform group-hover:rotate-6" style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)' }}>
                            <span className="text-lg font-black font-display tracking-tighter">S</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-brand-text-primary">ScaletoTop</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-2">
                        {NAV_ITEMS.map(item => (
                            <Link key={item.href} href={item.href} className={getLinkClass(item.href)}>
                                <NavIcon type={item.icon} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    {session ? (
                        <Link href="/dashboard">
                            <Button as="span" variant="ghost" size="sm" className="text-xs uppercase tracking-widest font-bold">控制台</Button>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button as="span" variant="ghost" size="sm" className="text-xs uppercase tracking-widest font-bold">登录</Button>
                        </Link>
                    )}
                    
                    {session ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(o => !o)}
                                className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center bg-brand-surface font-display font-bold text-xs hover:border-brand-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                            >
                                {session.user.name?.[0]?.toUpperCase() || 'U'}
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-12 w-40 bg-white border border-brand-border rounded-lg shadow-md z-50 overflow-hidden">
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setDropdownOpen(false)}
                                        className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary transition-colors"
                                    >
                                        控制台
                                    </Link>
                                    <div className="border-t border-brand-border" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-error hover:bg-brand-error/5 transition-colors"
                                    >
                                        退出登录
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/register">
                            <Button as="span" variant="gradient" size="sm" className="hidden sm:inline-flex text-xs uppercase tracking-widest font-bold">开启旅程</Button>
                        </Link>
                    )}
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
                                <span className="text-sm font-black font-display tracking-tighter">S</span>
                            </div>
                            <span className="text-base font-bold tracking-tight text-brand-text-primary">ScaletoTop</span>
                        </div>
                        <p className="text-brand-text-secondary text-base leading-relaxed mb-8">
                            引领数字营销的工程化革命。通过技术深度驱动持续、可量化的业务增长。
                        </p>
                        <div className="flex gap-5">
                            <a href="https://twitter.com/jack_scaletotop" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-primary hover:border-brand-primary transition-all">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            </a>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-20">
                        {FOOTER_LINKS.map(group => (
                            <div key={group.title}>
                                <h5 className="text-brand-text-primary font-bold text-sm mb-8 tracking-widest uppercase">{group.title}</h5>
                                <ul className="space-y-4 text-sm text-brand-text-secondary">
                                    {group.links.map(link => (
                                        <li key={link.label} className={link.disabled ? "opacity-50 cursor-not-allowed" : ""}>
                                            {link.disabled ? (
                                                link.label
                                            ) : (
                                                <Link href={link.href} className="hover:text-brand-text-primary transition-colors">{link.label}</Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-24 pt-10 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                        © 2026 ScaletoTop 工程部。为高增长团队打造。
                    </p>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                        <Link href="/contact" className="hover:text-brand-primary">联系我们</Link>
                        <Link href="/refund" className="hover:text-brand-primary">退款政策</Link>
                        <button className="hover:text-brand-primary cursor-default">中文 (简体)</button>
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
