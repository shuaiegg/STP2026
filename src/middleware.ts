import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    // Better Auth default session cookie name
    const sessionCookie = request.cookies.get("better-auth.session_token");

    // 1. Path check
    const isPathAdmin = request.nextUrl.pathname.startsWith('/admin');
    const isPathDashboard = request.nextUrl.pathname.startsWith('/dashboard');
    const isPathLogin = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/admin/login';
    const isPathSetup = request.nextUrl.pathname === '/admin/setup';
    const isPathApiAuth = request.nextUrl.pathname.startsWith('/api/auth');

    // 2. Allow API auth routes, setup page, and non-protected routes to pass through
    if (isPathApiAuth || isPathSetup || (!isPathAdmin && !isPathDashboard)) {
        return NextResponse.next();
    }

    // 3. If it's a protected path (admin or dashboard) but not the login page, check session
    if ((isPathAdmin || isPathDashboard) && !isPathLogin) {
        if (!sessionCookie) {
            const loginPath = isPathAdmin ? "/admin/login" : "/login";
            return NextResponse.redirect(new URL(loginPath, request.url));
        }
    }

    // 4. If it's the login page and user is already logged in, redirect accordingly
    if (isPathLogin && sessionCookie) {
        const targetPath = isPathAdmin ? "/admin" : "/dashboard";
        return NextResponse.redirect(new URL(targetPath, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*', '/api/auth/:path*'],
};
