import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mpuymyazmdgcemaytrxt.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://*.googletagmanager.com https://us.i.posthog.com wss://us.i.posthog.com",
      "frame-src https://www.googletagmanager.com",
      "worker-src blob: 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/email-o-t-p/:path*',
        destination: '/api/auth/email-otp/:path*',
      },
      {
        source: '/api/auth/sign-in/email-o-t-p',
        destination: '/api/auth/sign-in/email-otp',
      },
      {
        source: '/api/auth/email-otp/send-verification-code',
        destination: '/api/auth/email-otp/send-verification-otp',
      },
    ];
  },
};

export default nextConfig;
