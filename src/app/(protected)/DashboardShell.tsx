"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Library,
    Zap,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Search,
    User as UserIcon,
    Mail,
    ShoppingBag,
    CreditCard,
    AlertCircle,
    FileText,
    RefreshCw,
    Users,
    LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Site {
    id: string;
    name: string | null;
    domain: string;
    isCompetitor: boolean;
}

// ─── File-scope copy (i18n ready) ─────────────────────────────────────────────

const COPY = {
    navSection: '系统控制中心',
    adminSection: '平台管理',
    logoName: 'STP 2026',
    searchPlaceholder: '搜索我的内容资产…',
    searchAriaLabel: '搜索内容资产',
    toggleOpenAriaLabel: '打开导航菜单',
    toggleCloseAriaLabel: '关闭导航菜单',
    dismissBannerAriaLabel: '关闭积分不足提醒',
    settingsLabel: '账号安全设置',
    signOutLabel: '退出登录',
    supportHeading: '需要帮助？',
    supportEmail: 'support@scaletotop.com',
    roleBadge: { ADMIN: '管理员', EDITOR: '编辑员', USER: '普通用户' } as Record<string, string>,
    lowCredit: {
        title: '账户积分不足：您仅剩',
        suffix: '积分',
        description: '请及时充值以保证 AI 工具的正常使用。',
        cta: '立即充值',
    },
} as const;

// ─── File-scope admin nav config ──────────────────────────────────────────────

const ADMIN_NAV_CONFIG = [
    { href: '/dashboard/admin/content', icon: FileText, label: '内容管理' },
    { href: '/dashboard/admin/sync', icon: RefreshCw, label: 'Notion 同步' },
    { href: '/dashboard/admin/users', icon: Users, label: '用户管理' },
    { href: '/dashboard/admin/orders', icon: ShoppingBag, label: '订单管理' },
    { href: '/dashboard/admin/credit-refund', icon: CreditCard, label: '积分管理' },
    { href: '/dashboard/admin/skills', icon: Zap, label: '技能管理' },
] as const;

// ─── NavItem ──────────────────────────────────────────────────────────────────

const NavItem = ({
    href, icon: Icon, label, active, onMouseEnter,
}: {
    href: string; icon: LucideIcon; label: string; active: boolean; onMouseEnter?: () => void;
}) => (
    <Link
        href={href}
        onMouseEnter={onMouseEnter}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
            active
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
        <Icon size={20} aria-hidden="true" className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
        <span className={`font-bold text-sm ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" aria-hidden="true" />}
    </Link>
);

// ─── DashboardShell ───────────────────────────────────────────────────────────

export function DashboardShell({
    children,
    initialSites,
    session: initialSession,
}: {
    children: React.ReactNode;
    initialSites: Site[];
    session: any;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showLowCreditBanner, setShowLowCreditBanner] = useState(true);
    // Start null — useEffect reads localStorage to avoid SSR/client hydration mismatch
    const [firstSiteId, setFirstSiteId] = useState<string | null>(null);

    const { data: session } = authClient.useSession();
    const currentSession = (session || initialSession) as {
        user: { id: string; name?: string | null; email: string; image?: string | null; role?: string; credits?: number; };
    } | null;

    useEffect(() => {
        if (initialSites && initialSites.length > 0) {
            const cachedId = localStorage.getItem('last_active_site_id');
            const ownedSites = initialSites.filter((s) => !s.isCompetitor);
            const defaultId =
                initialSites.find((s) => s.id === cachedId)?.id ||
                (ownedSites.length > 0 ? ownedSites[0].id : initialSites[0].id);
            setFirstSiteId(defaultId);
            localStorage.setItem('last_active_site_id', defaultId);
            localStorage.setItem('stp_sites_cache', JSON.stringify(initialSites));
            localStorage.setItem('stp_sites_cache_time', Date.now().toString());
        }
    }, [initialSites]);

    const handleSignOut = async () => {
        await authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/login') } });
    };

    const handlePrefetch = (href: string) => router.prefetch(href);

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: '控制面板' },
        {
            href: firstSiteId ? `/dashboard/site-intelligence/${firstSiteId}` : '/dashboard/site-intelligence',
            icon: Zap,
            label: '站点智能管家',
        },
        { href: '/dashboard/library', icon: Library, label: '内容资产库' },
        { href: '/dashboard/tools', icon: Zap, label: '营销工具箱' },
        { href: '/dashboard/billing', icon: BarChart3, label: '流量与账单' },
    ];

    const role = currentSession?.user?.role;
    const adminNavItems = [...ADMIN_NAV_CONFIG].filter((item) => {
        if (role === 'ADMIN') return true;
        if (role === 'EDITOR') {
            return item.href === '/dashboard/admin/content' || item.href === '/dashboard/admin/sync';
        }
        return false;
    });

    const credits = Number(currentSession?.user?.credits || 0);
    const roleBadgeText = COPY.roleBadge[currentSession?.user?.role ?? ''] ?? COPY.roleBadge.USER;

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transition-transform duration-300 lg:static lg:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full p-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-12 px-2">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 transition-transform group-hover:rotate-12 relative">
                                <Image src="/assets/images/logo.svg" alt="STP Logo" fill className="object-contain" />
                            </div>
                            <span className="text-xl font-black italic tracking-tighter text-slate-900 font-display">
                                {COPY.logoName}
                            </span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2" aria-label="主导航">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 ml-4">
                            {COPY.navSection}
                        </div>
                        {navItems.map((item) => (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                onMouseEnter={() => handlePrefetch(item.href)}
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
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-8 mb-6 ml-4">
                                    {COPY.adminSection}
                                </div>
                                {adminNavItems.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        onMouseEnter={() => handlePrefetch(item.href)}
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
                            label={COPY.settingsLabel}
                            onMouseEnter={() => handlePrefetch('/dashboard/settings')}
                            active={pathname === '/dashboard/settings'}
                        />
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="justify-start gap-3 px-4 py-3 h-auto rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm focus-visible:ring-2 focus-visible:ring-red-400/50"
                        >
                            <LogOut size={20} aria-hidden="true" />
                            <span>{COPY.signOutLabel}</span>
                        </Button>
                    </div>

                    {/* Support Area */}
                    <div className="mt-6 px-4 py-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <Mail size={12} aria-hidden="true" className="text-brand-primary" />
                            {COPY.supportHeading}
                        </div>
                        <a
                            href="mailto:support@scaletotop.com"
                            className="text-[11px] font-bold text-slate-600 hover:text-brand-primary transition-colors truncate block"
                        >
                            {COPY.supportEmail}
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
                            aria-label={isSidebarOpen ? COPY.toggleCloseAriaLabel : COPY.toggleOpenAriaLabel}
                            aria-expanded={isSidebarOpen}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
                        </button>

                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} aria-hidden="true" />
                            <input
                                type="search"
                                aria-label={COPY.searchAriaLabel}
                                placeholder={COPY.searchPlaceholder}
                                className="bg-slate-50 border-none rounded-lg py-2.5 pl-12 pr-6 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none w-80 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard/billing"
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 transition-all border border-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                        >
                            <Zap size={14} aria-hidden="true" className="fill-brand-primary" />
                            <span className="text-sm font-black">{credits}</span>
                        </Link>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900">{currentSession?.user?.name || '用户'}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded">
                                {roleBadgeText}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center relative">
                            {currentSession?.user?.image ? (
                                <Image src={currentSession.user.image} alt="" fill className="object-cover" />
                            ) : (
                                <UserIcon className="text-slate-300" size={24} aria-hidden="true" />
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 p-10 overflow-auto scrollbar-hide">
                    {credits < 10 && showLowCreditBanner && (
                        <div
                            role="alert"
                            className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between motion-safe:animate-in motion-safe:slide-in-from-top-4 duration-500"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <AlertCircle size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">
                                        {COPY.lowCredit.title}{' '}
                                        <span className="text-red-600">{credits}</span>{' '}
                                        {COPY.lowCredit.suffix}
                                    </p>
                                    <p className="text-[10px] text-amber-700 font-medium">{COPY.lowCredit.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/dashboard/billing">
                                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none h-8 px-4 text-xs font-black uppercase">
                                        {COPY.lowCredit.cta}
                                    </Button>
                                </Link>
                                <button
                                    aria-label={COPY.dismissBannerAriaLabel}
                                    onClick={() => setShowLowCreditBanner(false)}
                                    className="p-1 hover:bg-amber-100 rounded-lg text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                                >
                                    <X size={16} aria-hidden="true" />
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
