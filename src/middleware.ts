import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // better-auth uses __Secure- prefix on HTTPS, plain name on HTTP
    const sessionCookie =
        request.cookies.get("better-auth.session_token") ??
        request.cookies.get("__Secure-better-auth.session_token");

    // --- 1. Unified Dashboard Redirect Rules ---
    
    // 2.1 Whitelist /admin/setup (Keep independent)
    if (pathname === '/admin/setup') {
        return NextResponse.next();
    }

    // 2.2 /admin/login → /login (301)
    if (pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/login', request.url), 301);
    }

    // 2.3 /admin → /dashboard (301)
    if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url), 301);
    }

    // 2.4 /admin/:path* → /dashboard/admin/:path* (301)
    // This handles sub-routes like /admin/content, /admin/sync etc.
    if (pathname.startsWith('/admin/')) {
        const newPath = pathname.replace('/admin/', '/dashboard/admin/');
        return NextResponse.redirect(new URL(newPath, request.url), 301);
    }

    // --- 2. Standard Protection Logic ---

    // Redirect already-authenticated users away from /login
    if (pathname === '/login' && sessionCookie) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const isPathDashboard = pathname.startsWith('/dashboard');
    const isPathApiAuth = pathname.startsWith('/api/auth');

    // Allow API auth and non-dashboard routes to pass through
    if (isPathApiAuth || !isPathDashboard) {
        return NextResponse.next();
    }

    // Protected dashboard paths: redirect unauthenticated users to /login
    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // 2.5 Ensure matcher includes /admin/:path* and /dashboard/:path*
    matcher: ['/admin/:path*', '/dashboard/:path*', '/api/auth/:path*', '/login'],
};
