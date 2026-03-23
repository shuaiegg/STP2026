import type { Metadata } from "next";
import Script from "next/script";
import { CSPostHogProvider } from "@/components/providers/PostHogProvider";
import { Toaster } from "sonner";
import "./globals.css";

// Configure fonts if needed, or rely on CSS imports in globals.css
// Keeping it simple as per legacy migration

export const metadata: Metadata = {
  title: "ScaletoTop | Digital Marketing Engineering",
  description: "Digital Marketing Engineering Platform",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="zh-Hans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        {isProduction && gtmId && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
      </head>
      <body className="antialiased text-brand-text-primary bg-brand-background">
        {isProduction && gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <CSPostHogProvider>
          {children}
        </CSPostHogProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
