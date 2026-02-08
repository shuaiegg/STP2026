"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    RefreshCw,
    BarChart3,
    Settings,
    Users,
    ChevronRight,
    LogOut,
    ExternalLink,
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => (
    <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${active
            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
            : 'text-brand-text-secondary hover:bg-brand-primary/10 hover:text-brand-primary'
            }`}
    >
        <Icon size={20} className={active ? 'text-white' : 'text-brand-text-muted group-hover:text-brand-primary'} />
        <span className="font-semibold">{label}</span>
        {active && <ChevronRight size={16} className="ml-auto text-white/50" />}
    </Link>
);

export default function AdminLayoutClient({ 
    children, 
    session: serverSession 
}: { 
    children: React.ReactNode, 
    session: any 
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    
    // Support both server-passed session and client-side hook for reactivity
    const { data: clientSession, isPending } = authClient.useSession();
    const session = clientSession || serverSession;

    React.useEffect(() => {
        // Redirection logic
        if (!isPending && !session && pathname !== '/admin/login' && pathname !== '/admin/setup') {
            router.push('/admin/login');
        }
        if (!isPending && session && (session.user as any)?.role === 'USER') {
            router.push('/dashboard');
        }
    }, [session, isPending, pathname, router]);

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/admin/login');
                }
            }
        });
    };

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: '控制面板' },
        { href: '/admin/content', icon: FileText, label: '内容管理' },
        { href: '/admin/sync', icon: RefreshCw, label: '同步状态' },
        { href: '/admin/analytics', icon: BarChart3, label: '数据分析' },
        { href: '/admin/users', icon: Users, label: '用户管理' },
    ];

    // If it's a login or setup page, we don't render the sidebar/header
    const isAuthPage = pathname === '/admin/login' || pathname === '/admin/setup';
    if (isAuthPage) return <>{children}</>;

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-12 px-2">
                        <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                            <BarChart3 size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">管理后台</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 ml-4">主菜单</div>
                        {navItems.map((item) => (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                active={item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)}
                            />
                        ))}
                    </nav>

                    <div className="pt-6 border-t border-slate-100 flex flex-col gap-2">
                        <NavItem
                            href="/admin/settings"
                            icon={Settings}
                            label="系统设置"
                            active={pathname.startsWith('/admin/settings')}
                        />
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            <ExternalLink size={20} />
                            <span className="font-semibold">返回官网</span>
                        </Link>
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="justify-start gap-3 px-4 py-3 h-auto rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-semibold"
                        >
                            <LogOut size={20} />
                            <span>退出登录</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 px-8 flex items-center justify-between">
                    <button
                        className="lg:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-lg"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="flex-1 max-w-xl mx-8 hidden md:block">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="搜索任何内容..."
                                className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-brand-primary/20 bg-slate-100/50 hover:bg-slate-100 transition-all"
                            />
                            <BarChart3 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-primary transition-colors" />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-bold text-slate-900">{session?.user?.name || (isPending ? '加载中...' : '管理员')}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                                {(session?.user as any)?.role === 'ADMIN' ? '超级权限' : '管理员'}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-brand-primary to-purple-600" />
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
