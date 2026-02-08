import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
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
