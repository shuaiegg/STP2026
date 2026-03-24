import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { CSPostHogProvider } from "@/components/providers/PostHogProvider";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ScaletoTop",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo-512.png`,
      "width": 512,
      "height": 512
    },
    "sameAs": [
      "https://twitter.com/jack_scaletotop",
      "https://www.linkedin.com/company/scaletotop"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ScaletoTop",
    "url": baseUrl
  };

  return (
    <html lang="zh-Hans" className={`${plusJakartaSans.variable} ${instrumentSans.variable} ${jetBrainsMono.variable}`}>
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
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
