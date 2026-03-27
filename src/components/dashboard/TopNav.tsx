"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  RefreshCw,
  Users,
  ShoppingBag,
  CreditCard,
  Menu,
  X
} from 'lucide-react';
import { HealthScoreBadge } from '@/components/ui/HealthScoreBadge';
import { authClient } from '@/lib/auth-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Site {
  id: string;
  domain: string;
  latestHealthScore: number | null;
}

interface User {
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string;
  credits?: number;
}

interface TopNavProps {
  sites: Site[];
  currentSiteId?: string;
  user: User;
}

// ─── Static config (file scope for i18n readiness) ────────────────────────────

const COPY = {
  logoName: 'STP 2026',
  logoAlt: 'STP Logo',
  noSite: '我的站点',
  noSites: '暂无站点',
  addSite: '添加新站点',
  adminSection: '平台管理',
  settings: '账号设置',
  signOut: '退出登录',
  credits: '积分',
  openSiteSwitcher: '打开站点切换器',
  openUserMenu: '打开用户菜单',
  siteSwitcherLabel: '站点切换列表',
  userMenuLabel: '用户菜单',
  openMobileMenu: '打开移动端菜单',
  closeMobileMenu: '关闭移动端菜单',
} as const;

const NAV_LINKS = [
  { name: '内容库', href: '/dashboard/library', icon: Library },
  { name: '工具箱', href: '/dashboard/tools', icon: Zap },
  { name: '积分', href: '/dashboard/billing', icon: BarChart3 },
] as const;

const ADMIN_LINK_CONFIG = [
  { href: '/admin/content', icon: FileText, label: '内容管理' },
  { href: '/admin/sync', icon: RefreshCw, label: 'Notion 同步' },
  { href: '/admin/users', icon: Users, label: '用户管理' },
  { href: '/admin/orders', icon: ShoppingBag, label: '订单管理' },
  { href: '/admin/skills', icon: Zap, label: '技能管理' },
  { href: '/admin/credit-refund', icon: CreditCard, label: '积分管理' },
] as const;

// ─── TopNav ───────────────────────────────────────────────────────────────────

export function TopNav({ sites, currentSiteId, user }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSiteOpen, setIsSiteOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const siteRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const siteTriggerRef = useRef<HTMLButtonElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  // Only show current site when the URL identifies one
  const displayedSite = sites.find(s => s.id === currentSiteId);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (siteRef.current && !siteRef.current.contains(event.target as Node)) {
        setIsSiteOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSiteOpen) {
          setIsSiteOpen(false);
          siteTriggerRef.current?.focus();
        }
        if (isUserOpen) {
          setIsUserOpen(false);
          userTriggerRef.current?.focus();
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          mobileTriggerRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSiteOpen, isUserOpen, isMobileMenuOpen]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push('/login') },
    });
  };

  const adminLinks = ADMIN_LINK_CONFIG.filter(link => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'EDITOR') {
      return link.href === '/admin/content' || link.href === '/admin/sync';
    }
    return false;
  });

  return (
    <nav className="h-14 border-b border-brand-border bg-brand-surface sticky top-0 z-40 px-4 flex items-center justify-between">
      {/* Left: Logo & Site Switcher */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile Menu Trigger */}
        <button
          ref={mobileTriggerRef}
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          aria-label={COPY.openMobileMenu}
        >
          <Menu size={24} />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 group" aria-label={COPY.logoName}>
          <div className="w-8 h-8 relative transition-transform group-hover:rotate-12">
            <Image src="/assets/images/logo.svg" alt={COPY.logoAlt} fill className="object-contain" />
          </div>
          <span className="text-lg font-black italic tracking-tighter text-brand-text-primary font-display hidden sm:block">
            {COPY.logoName}
          </span>
        </Link>

        <div className="h-6 w-px bg-brand-border hidden sm:block" aria-hidden="true" />

        {/* Split Button: domain name → workbench link; chevron → dropdown */}
        <div className="relative flex items-center" ref={siteRef}>
          {displayedSite ? (
            <>
              {/* Domain name → go directly to site workbench */}
              <Link
                href={`/dashboard/site-intelligence/${displayedSite.id}`}
                className="text-sm font-semibold text-brand-text-primary hover:text-brand-primary transition-colors max-w-[120px] sm:max-w-[150px] truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg"
              >
                {displayedSite.domain}
              </Link>
              {/* Chevron → open site switcher */}
              <button
                ref={siteTriggerRef}
                onClick={() => setIsSiteOpen(prev => !prev)}
                aria-label={COPY.openSiteSwitcher}
                aria-expanded={isSiteOpen}
                aria-haspopup="listbox"
                className="ml-1 p-1 rounded-lg hover:bg-brand-surface-alt text-brand-text-muted hover:text-brand-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
              >
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`transition-transform ${isSiteOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </>
          ) : (
            /* Not on a site page: simple link back to /dashboard (smart routing handles redirect) */
            <Link
              href="/dashboard"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg"
            >
              {COPY.noSite}
            </Link>
          )}

          {isSiteOpen && (
            <div
              role="listbox"
              aria-label={COPY.siteSwitcherLabel}
              className="absolute top-full left-0 mt-2 w-64 bg-brand-surface border border-brand-border rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <div className="max-h-60 overflow-auto">
                {sites.length > 0 ? (
                  sites.map(site => (
                    <button
                      key={site.id}
                      role="option"
                      aria-selected={site.id === currentSiteId}
                      onClick={() => {
                        router.push(`/dashboard/site-intelligence/${site.id}`);
                        setIsSiteOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-brand-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${site.id === currentSiteId ? 'font-semibold text-brand-text-primary' : 'text-brand-text-secondary'}`}>
                          {site.domain}
                        </span>
                        <HealthScoreBadge score={site.latestHealthScore} />
                      </div>
                      {site.id === currentSiteId && (
                        <Check size={14} aria-hidden="true" className="text-brand-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-brand-text-muted italic">{COPY.noSites}</div>
                )}
              </div>
              <div className="border-t border-brand-border mt-2 pt-2">
                <Link
                  href="/dashboard/onboarding"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-brand-primary hover:bg-brand-surface-alt transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/50"
                  onClick={() => setIsSiteOpen(false)}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span>{COPY.addSite}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map(link => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg px-1 ${
                isActive ? 'text-brand-text-primary font-semibold' : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Right: Credits + User */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/billing"
          aria-label={`${user.credits ?? 0} ${COPY.credits}`}
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-primary/5 text-brand-primary border border-brand-primary/10 hover:bg-brand-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
        >
          <Zap size={14} aria-hidden="true" className="fill-brand-primary" />
          <span className="text-xs font-bold">{user.credits ?? 0}</span>
        </Link>

        <div className="relative" ref={userRef}>
          <button
            ref={userTriggerRef}
            onClick={() => setIsUserOpen(prev => !prev)}
            aria-label={COPY.openUserMenu}
            aria-expanded={isUserOpen}
            aria-haspopup="menu"
            className="w-8 h-8 rounded-lg bg-brand-surface-alt border border-brand-border overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-brand-primary/20 transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          >
            {user.image ? (
              <Image src={user.image} alt="" fill className="object-cover" />
            ) : (
              <span className="text-xs font-bold text-brand-text-secondary">
                {(user.name || user.email || '?')[0].toUpperCase()}
              </span>
            )}
          </button>

          {isUserOpen && (
            <div
              role="menu"
              aria-label={COPY.userMenuLabel}
              className="absolute top-full right-0 mt-2 w-56 bg-brand-surface border border-brand-border rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <div className="px-4 py-2 border-b border-brand-border mb-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-semibold text-brand-text-primary truncate">{user.name || '用户'}</p>
                  {user.role && (
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-1.5 py-0.5 rounded">
                      {user.role}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-brand-text-muted truncate">{user.email}</p>
              </div>

              {adminLinks.length > 0 && (
                <>
                  <div className="px-4 py-1.5 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                    {COPY.adminSection}
                  </div>
                  {adminLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/50"
                      onClick={() => setIsUserOpen(false)}
                    >
                      <link.icon size={14} aria-hidden="true" className="text-brand-text-muted" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  <div className="h-px bg-brand-border my-1" aria-hidden="true" />
                </>
              )}

              <Link
                href="/dashboard/settings"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/50"
                onClick={() => setIsUserOpen(false)}
              >
                <Settings size={14} aria-hidden="true" className="text-brand-text-muted" />
                <span>{COPY.settings}</span>
              </Link>
              <button
                role="menuitem"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-error hover:bg-brand-error/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/50"
              >
                <LogOut size={14} aria-hidden="true" />
                <span>{COPY.signOut}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="导航菜单"
            className="fixed inset-y-0 left-0 w-72 bg-brand-surface z-50 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col"
          >
            <div className="h-14 border-b border-brand-border px-4 flex items-center justify-between">
              <span className="font-bold text-brand-text-primary">{COPY.logoName}</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-brand-text-secondary hover:text-brand-text-primary"
                aria-label={COPY.closeMobileMenu}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-4">
              <div className="px-4 mb-6">
                <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-4">导航</div>
                <div className="space-y-1">
                  {NAV_LINKS.map(link => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-brand-primary/5 text-brand-primary font-bold' : 'text-brand-text-secondary hover:bg-brand-surface-alt'
                        }`}
                      >
                        <link.icon size={18} />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {adminLinks.length > 0 && (
                <div className="px-4">
                  <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-4">管理</div>
                  <div className="space-y-1">
                    {adminLinks.map(link => {
                      const isActive = pathname.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive ? 'bg-brand-primary/5 text-brand-primary font-bold' : 'text-brand-text-secondary hover:bg-brand-surface-alt'
                          }`}
                        >
                          <link.icon size={18} />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
