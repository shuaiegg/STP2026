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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
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
