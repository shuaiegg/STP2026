"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Library,
    Zap,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight,
    Menu,
    X,
    Search,
    User as UserIcon,
    ArrowUpRight,
    History,
    Home,
    FileText,
    RefreshCw,
    Users,
    Mail,
    ShoppingBag,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => (
    <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${active
            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
    >
        <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
        <span className={`font-bold text-sm ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
    </Link>
);

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showLowCreditBanner, setShowLowCreditBanner] = useState(true);
    const [firstSiteId, setFirstSiteId] = useState<string | null>(null);
    const { data: session, isPending } = authClient.useSession();

    React.useEffect(() => {
        const controller = new AbortController();
        // Try to load from localStorage first for instant rendering
        const cachedId = localStorage.getItem('last_active_site_id');
        if (cachedId) setFirstSiteId(cachedId);

        const CACHE_KEY = 'stp_sites_cache';
        const CACHE_TIME_KEY = 'stp_sites_cache_time';
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        fetch('/api/dashboard/sites', { signal: controller.signal })
            .then(r => r.json())
            .then(data => {
                if (data.sites && data.sites.length > 0) {
                    const ownedSites = data.sites.filter((s: any) => !s.isCompetitor);
                    const defaultId = data.sites.find((s: any) => s.id === cachedId)?.id || 
                                     (ownedSites.length > 0 ? ownedSites[0].id : data.sites[0].id);
                    
                    setFirstSiteId(defaultId);
                    localStorage.setItem('last_active_site_id', defaultId);
                    
                    // Cache the whole sites array
                    localStorage.setItem(CACHE_KEY, JSON.stringify(data.sites));
                    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error(err);
            });

        return () => controller.abort(new DOMException('Component unmounted', 'AbortError'));
    }, []);

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/login');
                }
            }
        });
    };

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: '控制面板 (Overview)' },
        {
            href: firstSiteId ? `/dashboard/site-intelligence/${firstSiteId}` : '/dashboard/site-intelligence',
            icon: Zap,
            label: '站点智能管家'
        },
        { href: '/dashboard/library', icon: Library, label: '内容资产库' },
        { href: '/dashboard/tools', icon: Zap, label: '营销工具箱' },
        { href: '/dashboard/billing', icon: BarChart3, label: '流量与账单' },
    ];

    const role = (session?.user as any)?.role;
    const adminNavItems = [
        { href: '/dashboard/admin/content', icon: FileText, label: '内容管理' },
        { href: '/dashboard/admin/sync', icon: RefreshCw, label: 'Notion 同步' },
        { href: '/dashboard/admin/users', icon: Users, label: '用户管理' },
        { href: '/dashboard/admin/orders', icon: ShoppingBag, label: '订单管理' },
        { href: '/dashboard/admin/credit-refund', icon: CreditCard, label: '积分管理' },
        { href: '/dashboard/admin/skills', icon: Zap, label: '技能管理' },
    ].filter(item => {
        if (role === 'ADMIN') return true;
        if (role === 'EDITOR') {
            return item.href === '/dashboard/admin/content' || item.href === '/dashboard/admin/sync';
        }
        return false;
    });

    // If still loading session, show a clean loader
    if (isPending && !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white animate-bounce shadow-xl">
                        <Zap size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted">登录中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-12 px-2">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 transition-transform group-hover:rotate-12 relative">
                                <Image src="/assets/images/logo.svg" alt="STP Logo" fill className="object-contain" />
                            </div>
                            <span className="text-xl font-black italic tracking-tighter text-slate-900 font-display">STP 2026</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 ml-4">系统控制中心</div>
                        {navItems.map((item) => (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                active={
                                    item.href === '/dashboard'
                                        ? pathname === '/dashboard'
                                        : item.href.includes('/site-intelligence')
                                            ? pathname.includes('/site-intelligence')
                                            : pathname.startsWith(item.href)
                                }
                            />
                        ))}

                        {adminNavItems.length > 0 && (
                            <>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-8 mb-6 ml-4">平台管理</div>
                                {adminNavItems.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        active={pathname.startsWith(item.href)}
                                    />
                                ))}
                            </>
                        )}
                    </nav>

                    {/* Footer Nav */}
                    <div className="pt-6 border-t border-slate-50 flex flex-col gap-2">
                        <NavItem
                            href="/dashboard/settings"
                            icon={Settings}
                            label="账号安全设置"
                            active={pathname === '/dashboard/settings'}
                        />
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="justify-start gap-3 px-4 py-3 h-auto rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
                        >
                            <LogOut size={20} />
                            <span>退出登录</span>
                        </Button>
                    </div>

                    {/* Support Area */}
                    <div className="mt-6 px-4 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <Mail size={12} className="text-brand-primary" /> 需要帮助？
                        </div>
                        <a 
                            href="mailto:support@scaletotop.com" 
                            className="text-[11px] font-bold text-slate-600 hover:text-brand-primary transition-colors truncate block"
                        >
                            support@scaletotop.com
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 px-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="搜索我的内容资产..."
                                className="bg-slate-50 border-none rounded-2xl py-2.5 pl-12 pr-6 text-sm focus:ring-2 focus:ring-brand-primary/10 w-80 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/billing" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 transition-all border border-brand-primary/10">
                            <Zap size={14} className="fill-brand-primary" />
                            <span className="text-sm font-black">{Number((session?.user as any)?.credits || 0)}</span>
                        </Link>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900">{session?.user?.name || '用户'}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded">
                                {(session?.user as any)?.role === 'ADMIN' ? '管理员' : (session?.user as any)?.role === 'EDITOR' ? '编辑员' : '普通用户'}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="text-slate-300" size={24} />
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 p-10 overflow-auto scrollbar-hide">
                    {Number((session?.user as any)?.credits || 0) < 10 && showLowCreditBanner && (
                        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <AlertCircle size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">
                                        账户积分不足：您仅剩 <span className="text-red-600">{Number((session?.user as any)?.credits || 0)}</span> 积分
                                    </p>
                                    <p className="text-[10px] text-amber-700 font-medium">请及时充值以保证 AI 工具的正常使用。</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/dashboard/billing">
                                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none h-8 px-4 text-xs font-black uppercase">
                                        立即充值
                                    </Button>
                                </Link>
                                <button 
                                    onClick={() => setShowLowCreditBanner(false)}
                                    className="p-1 hover:bg-amber-100 rounded-lg text-amber-400 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
