"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ChevronDown,
  Plus,
  Check,
  Library,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Users,
  ShoppingBag,
  CreditCard,
  Menu,
  X,
  Plug,
  Cpu,
  MessageSquare,
  Globe,
  Search,
  LineChart,
  ShieldAlert,
  Home,
} from 'lucide-react';
import { HealthScoreBadge } from '@/components/ui/HealthScoreBadge';
import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';

interface Site {
  id: string;
  domain: string;
  latestHealthScore: number | null;
}

interface User {
  id?: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  credits?: number;
}

interface SidebarNavProps {
  sites: Site[];
  currentSiteId?: string;
  user: User;
}

export function SidebarNav({ sites, currentSiteId, user }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard.topNav');

  const [isSiteOpen, setIsSiteOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);
  const [currentHash, setCurrentHash] = useState('');

  const siteRef = useRef<HTMLDivElement>(null);

  // Sync window hash
  useEffect(() => {
    setCurrentHash(window.location.hash);
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (siteRef.current && !siteRef.current.contains(event.target as Node)) {
        setIsSiteOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push('/login') },
    });
  };

  const toggleLanguage = async () => {
    if (isSwitchingLang) return;
    setIsSwitchingLang(true);
    try {
      const nextLocale = locale === 'zh' ? 'en' : 'zh';
      // 1. Persist to DB (dashboard locale 跟 User.locale 走)
      await authClient.updateUser({ locale: nextLocale });

      // 2. Align public-side suggestion / manual-choice cookie
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;

      // 3. 关键：session 开了 cookieCache(5min)，必须强制刷新缓存，
      //    否则服务端 getSession 仍返回旧 locale → UI 语言不变
      await authClient.getSession({ query: { disableCookieCache: true } });

      // 4. 硬刷新，确保 protected layout 用新 session 重渲染
      window.location.reload();
    } catch (err) {
      console.error('Failed to change language:', err);
      setIsSwitchingLang(false);
    }
  };

  const displayedSite = sites.find(s => s.id === currentSiteId) || sites[0];
  const siteId = displayedSite?.id;
  // 无站点时，"home" 是 onboarding —— 绝不指向只会 307 的 /dashboard（否则常驻侧边栏会
  // 反复 prefetch/导航该重定向路由，触发浏览器导航限流、卡死）。
  const homeHref = siteId ? '/dashboard' : '/dashboard/onboarding';

  // Primary Navigation mapping: Overview → Diagnose → Produce → Measure
  const primaryLinks = [
    {
      name: t('overview'),
      href: homeHref,
      icon: Home,
      isActive: pathname === '/dashboard',
    },
    {
      name: t('diagnose'),
      href: siteId ? `/dashboard/site-intelligence/${siteId}` : '/dashboard/onboarding',
      icon: Search,
      isActive: siteId
        ? pathname.startsWith(`/dashboard/site-intelligence/${siteId}`) && currentHash !== '#performance'
        : pathname === '/dashboard/onboarding',
    },
    {
      name: t('produce'),
      // 只有一个生产工具 → 直达写作，不经工具中转页
      href: '/dashboard/tools/geo-writer',
      icon: Zap,
      // 内容库是独立次级项，由其自身高亮（避免双高亮）
      isActive: pathname.startsWith('/dashboard/tools'),
    },
    {
      name: t('measure'),
      href: siteId ? `/dashboard/site-intelligence/${siteId}#performance` : '/dashboard/onboarding',
      icon: LineChart,
      isActive: siteId
        ? pathname.startsWith(`/dashboard/site-intelligence/${siteId}`) && currentHash === '#performance'
        : false,
    },
  ];

  const secondaryLinks = [
    { name: t('library'), href: '/dashboard/library', icon: Library, isActive: pathname === '/dashboard/library' },
    { name: t('billing'), href: '/dashboard/billing', icon: CreditCard, isActive: pathname === '/dashboard/billing' },
  ];

  const adminLinks = [
    { href: '/admin/content', icon: FileText, label: t('admin.content') },
    { href: '/admin/users', icon: Users, label: t('admin.users') },
    { href: '/admin/orders', icon: ShoppingBag, label: t('admin.orders') },
    { href: '/admin/skills', icon: Zap, label: t('admin.skills') },
    { href: '/admin/credit-refund', icon: CreditCard, label: t('admin.creditRefund') },
    { href: '/admin/integrations', icon: Plug, label: t('admin.integrations') },
    { href: '/admin/models', icon: Cpu, label: t('admin.models') },
    { href: '/admin/consultations', icon: MessageSquare, label: t('admin.consultations') },
  ].filter(link => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'EDITOR') {
      return link.href === '/admin/content';
    }
    return false;
  });

  const SidebarContent = () => (
    <div className="flex-1 flex flex-col h-full bg-white text-brand-text-primary">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 py-5">
        {/* Workspace Brand Title */}
        <div className="px-6 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md bg-brand-text-primary group-hover:rotate-6 transition-transform">
              <span className="text-base font-black font-display tracking-tighter">S</span>
            </div>
            <span className="text-base font-bold tracking-tight text-brand-text-primary font-display">
              ScaletoTop
            </span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label={t('closeMobileMenu')}
            className="md:hidden p-1.5 rounded-lg hover:bg-brand-surface text-brand-text-muted focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:outline-none"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Site Switcher (sticky Context) */}
        <div className="px-4" ref={siteRef}>
          {displayedSite ? (
            <div className="relative">
              <button
                onClick={() => setIsSiteOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-border hover:border-brand-border-heavy hover:bg-brand-surface/60 hover:shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:outline-none"
              >
                <div className="flex flex-col items-start min-w-0 pr-2">
                  <span className="text-xs font-black uppercase tracking-widest text-brand-text-muted mb-0.5">{t('mySite')}</span>
                  <span className="text-sm font-bold text-brand-text-primary truncate w-full text-left">{displayedSite.domain}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <HealthScoreBadge score={displayedSite.latestHealthScore} />
                  <ChevronDown size={14} className={`text-brand-text-muted transition-transform ${isSiteOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isSiteOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-brand-border rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
                  {sites.length > 0 ? (
                    sites.map(site => (
                      <button
                        key={site.id}
                        onClick={() => {
                          router.push(`/dashboard/site-intelligence/${site.id}`);
                          setIsSiteOpen(false);
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-brand-surface transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs truncate ${site.id === currentSiteId ? 'font-bold text-brand-text-primary' : 'text-brand-text-secondary'}`}>
                            {site.domain}
                          </span>
                          <HealthScoreBadge score={site.latestHealthScore} />
                        </div>
                        {site.id === currentSiteId && (
                          <Check size={12} className="text-brand-primary shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-brand-text-muted italic">{t('noSites')}</div>
                  )}
                  <div className="border-t border-brand-surface mt-1.5 pt-1.5 px-1">
                    <Link
                      href="/dashboard/onboarding"
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-brand-secondary hover:bg-brand-surface rounded-md transition-colors font-bold"
                      onClick={() => { setIsSiteOpen(false); setIsMobileOpen(false); }}
                    >
                      <Plus size={14} />
                      <span>{t('addSite')}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/dashboard/onboarding"
              onClick={() => setIsMobileOpen(false)}
              className="w-full flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-brand-border-heavy text-brand-text-muted hover:text-brand-secondary hover:border-brand-secondary/30 hover:bg-brand-secondary-muted transition-colors font-bold text-xs"
            >
              <Plus size={14} className="mr-1.5" /> {t('addSite')}
            </Link>
          )}
        </div>

        {/* Primary Navigation tabs */}
        <div className="px-2 space-y-1">
          <div className="px-4 py-1.5 text-[9px] font-black text-brand-text-muted uppercase tracking-widest">{t('navSection')}</div>
          {primaryLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                link.isActive
                  ? 'bg-brand-text-primary text-white font-bold shadow-sm'
                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface font-medium'
              }`}
            >
              <link.icon size={18} className={link.isActive ? 'text-white' : 'text-brand-text-muted'} />
              <span>{link.name}</span>
            </Link>
          ))}
        </div>

        {/* Secondary Navigation */}
        <div className="px-2 space-y-1">
          {secondaryLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                link.isActive 
                  ? 'bg-brand-border text-brand-text-primary font-bold' 
                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface font-medium'
              }`}
            >
              <link.icon size={18} className={link.isActive ? 'text-brand-text-primary' : 'text-brand-text-muted'} />
              <span>{link.name}</span>
            </Link>
          ))}
        </div>

        {/* Admin Section Accordion */}
        {adminLinks.length > 0 && (
          <div className="px-2">
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="w-full flex items-center justify-between px-4 py-2 text-[9px] font-black text-brand-text-muted uppercase tracking-widest hover:text-brand-text-secondary transition-colors"
            >
              <span>{t('adminSection')}</span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${isAdminOpen ? '' : '-rotate-90'}`} />
            </button>
            {isAdminOpen && (
              <div className="space-y-0.5 mt-1 animate-in fade-in duration-200">
                {adminLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-brand-border text-brand-text-primary font-bold'
                          : 'text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface'
                      }`}
                    >
                      <link.icon size={14} className={isActive ? 'text-brand-text-primary' : 'text-brand-text-muted'} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* User Info Area (bottom sticky) */}
      <div className="shrink-0 border-t border-brand-border p-4 space-y-4 bg-brand-surface/60">
        {/* Credits usage display */}
        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-brand-border">
          <div className="flex items-center gap-2">
            <Zap size={14} className="fill-brand-warning text-brand-warning shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-brand-text-secondary">{user.credits ?? 0} {t('credits')}</span>
          </div>
          <Link
            href="/dashboard/billing"
            className="text-[10px] font-black uppercase text-brand-secondary hover:text-brand-secondary-hover transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            {t('topUp')}
          </Link>
        </div>

        {/* User profile row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-lg bg-brand-border-heavy overflow-hidden flex items-center justify-center border border-brand-border shrink-0">
              {user.image ? (
                <img src={user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-brand-text-muted">
                  {(user.name || user.email || '?')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-brand-text-primary truncate leading-snug">{user.name || 'User'}</span>
              <span className="text-[10px] text-brand-text-muted truncate">{user.email}</span>
            </div>
          </div>
          
          <Link
            href="/dashboard/settings"
            title={t('settings')}
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text-secondary hover:bg-white border border-transparent hover:border-brand-border transition-all"
          >
            <Settings size={16} />
          </Link>
        </div>

        {/* Footer actions: language switch switcher & logout */}
        <div className="flex items-center justify-between border-t border-brand-border pt-3 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
          <button
            onClick={toggleLanguage}
            disabled={isSwitchingLang}
            className="flex items-center gap-1.5 hover:text-brand-secondary transition-colors focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:outline-none rounded"
          >
            <Globe size={13} />
            <span>{t('nextLang')}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-brand-error hover:text-brand-error transition-colors focus-visible:ring-2 focus-visible:ring-brand-error focus-visible:outline-none rounded"
          >
            <LogOut size={13} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR: Permanent on left */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-brand-border bg-white h-screen z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden h-14 border-b border-brand-border bg-white flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-label={t('openMobileMenu')}
            className="p-1.5 -ml-1.5 text-brand-text-secondary hover:bg-brand-surface rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:outline-none"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <span className="text-sm font-bold text-brand-text-primary font-display truncate max-w-[150px]">
            {displayedSite ? displayedSite.domain : 'ScaletoTop'}
          </span>
        </div>

        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-warning/10 text-brand-warning border border-brand-warning/20 hover:bg-brand-warning/20 transition-colors"
        >
          <Zap size={12} className="fill-brand-warning text-brand-warning" />
          <span className="text-[10px] font-bold">{user.credits ?? 0}</span>
        </Link>
      </header>

      {/* MOBILE DRAWER DRAWER */}
      {isMobileOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-brand-text-primary/40 backdrop-blur-sm z-50 animate-in fade-in duration-300 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Mobile Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300 md:hidden h-screen flex flex-col">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
