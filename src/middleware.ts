import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// 公开站点的 locale 解析（en 根路径 / zh 前缀），不做自动语言跳转
const intlMiddleware = createMiddleware(routing);

// 注：运行时 slug/类别重定向不在 middleware 处理（避免每请求 DB/网络往返）。
// 这些路径都会走 /blog、/blog/category 页面的 notFound 分支，在那里查 Redirect 表 308 跳转。
// 见 src/lib/redirects.ts。

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // better-auth uses __Secure- prefix on HTTPS, plain name on HTTP
    const sessionCookie =
        request.cookies.get("better-auth.session_token") ??
        request.cookies.get("__Secure-better-auth.session_token");

    // --- 1. Unified Dashboard Redirect Rules ---

    // 1.1 Whitelist /admin/setup (Keep independent)
    if (pathname === '/admin/setup') {
        return NextResponse.next();
    }

    // 1.2 /admin/login → /login (301)
    if (pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/login', request.url), 301);
    }

    // 1.3 /admin → /dashboard (301)
    if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url), 301);
    }

    // 1.4 /admin/:path* → /dashboard/admin/:path* (301)
    if (pathname.startsWith('/admin/')) {
        const newPath = pathname.replace('/admin/', '/dashboard/admin/');
        return NextResponse.redirect(new URL(newPath, request.url), 301);
    }

    // 1.5 /tools/geo-writer (+ /zh/tools/geo-writer) → /tools (301)
    if (pathname === '/tools/geo-writer' || pathname.startsWith('/tools/geo-writer/')) {
        return NextResponse.redirect(new URL('/tools', request.url), 301);
    }
    if (pathname === '/zh/tools/geo-writer' || pathname.startsWith('/zh/tools/geo-writer/')) {
        return NextResponse.redirect(new URL('/zh/tools', request.url), 301);
    }

    // --- 2. Protected app routes (no locale segment, skip intl) ---

    if (pathname.startsWith('/dashboard')) {
        // Redirect unauthenticated users to /login
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    // --- 3. Public routes (locale-aware) ---

    // Redirect already-authenticated users away from login pages (/login, /zh/login).
    // BUT skip this when arriving with ?expired=1 — that means the server validated the
    // session cookie and found it INVALID (present-but-stale). Without this guard, an
    // invalid-but-present cookie causes an infinite /dashboard ⇄ /login loop:
    // middleware trusts presence → /dashboard; server validates → invalid → /login → …
    if ((pathname === '/login' || pathname === '/zh/login')
        && sessionCookie
        && !request.nextUrl.searchParams.has('expired')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // next-intl: locale 前缀解析/规范化（/en/* → /*，/zh 保持前缀）
    return intlMiddleware(request);
}

export const config = {
    // 覆盖除 api、Next 内部资源、静态文件（含点号）外的全部路径
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
