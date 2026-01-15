import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    // Better Auth default session cookie name
    const sessionCookie = request.cookies.get("better-auth.session_token");

    // 1. Path check
    const isPathAdmin = request.nextUrl.pathname.startsWith('/admin');
    const isPathLogin = request.nextUrl.pathname === '/admin/login';
    const isPathSetup = request.nextUrl.pathname === '/admin/setup';
    const isPathApiAuth = request.nextUrl.pathname.startsWith('/api/auth');

    // 2. Allow API auth routes, setup page, and non-admin routes to pass through
    if (isPathApiAuth || isPathSetup || !isPathAdmin) {
        return NextResponse.next();
    }

    // 3. If it's an admin path but not the login page, check session
    if (isPathAdmin && !isPathLogin) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // 4. If it's the login page and user is already logged in, redirect to admin dashboard
    if (isPathLogin && sessionCookie) {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/auth/:path*'],
};
